'use client'

// 리스트 실시간 스왑(노션식) — 공용 엔진. 가로(컬럼)·세로(행) 모두 지원.
// 행/블록/컬럼 DOM 을 끌면 형제가 실시간으로 비켜나며 자리를 내주고, 놓으면 onCommit(from,to) 으로
// 최종 순서를 알린다. ProseMirror 블록(editor-core)·인라인표(collections)·멀티셀렉트 옵션·
// 컬렉션 표·컬렉션 헤더가 모두 같은 엔진을 쓰도록 기반 레이어(DS)에 둔다.
//
// 순수 기하(computeReorder/reorderArray)는 DOM 무관·테스트 가능. beginListReorder 가 그 위에서
// pointer 이벤트와 transform 애니메이션을 입힌다. (editor-core/reorder-math 는 이 모듈을 re-export.)

export type ReorderResult = { ins: number; offsets: number[] }

/**
 * 배열에서 from 위치 항목을 빼서 to 위치(빼낸 뒤 기준 인덱스)에 끼운 새 배열.
 * 드래그 드롭 커밋의 "최종 순서"를 만든다.
 */
export function reorderArray<T>(items: readonly T[], from: number, to: number): T[] {
  const copy = items.slice()
  if (from < 0 || from >= copy.length) return copy
  const [moved] = copy.splice(from, 1)
  const clamped = Math.max(0, Math.min(to, copy.length))
  copy.splice(clamped, 0, moved)
  return copy
}

/**
 * 드래그 중 기하 계산 — 형제들의 원래 top/height 와 변위(deltaY)로
 * ins(놓을 삽입 인덱스, 드래그 항목 제외 기준)와 offsets(각 항목 translateY)를 만든다.
 */
export function computeReorder(
  tops: number[],
  heights: number[],
  gap: number,
  draggedIdx: number,
  deltaY: number,
): ReorderResult {
  const n = tops.length
  const center = (i: number) => tops[i] + heights[i] / 2
  const draggedCenter = center(draggedIdx) + deltaY

  let ins = 0
  for (let i = 0; i < n; i++) {
    if (i === draggedIdx) continue
    if (center(i) < draggedCenter) ins++
  }

  const order: number[] = []
  for (let i = 0; i < n; i++) if (i !== draggedIdx) order.push(i)
  order.splice(ins, 0, draggedIdx)

  const baseTop = Math.min(...tops)
  const finalTop = new Array<number>(n)
  let cur = baseTop
  for (const idx of order) {
    finalTop[idx] = cur
    cur += heights[idx] + gap
  }

  const offsets = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    offsets[i] = i === draggedIdx ? deltaY : finalTop[i] - tops[i]
  }
  return { ins, offsets }
}

const SHIFT_TRANSITION = 'transform 160ms cubic-bezier(0, 0, 0.2, 1)'

export type ListReorderItem = {
  /** 측정·드래그 추적의 주된 DOM(rect 기준점). */
  dom: HTMLElement
  /**
   * 함께 transform 을 동기화할 추가 DOM(측정엔 미사용 — 컬럼 reorder 시 본문 td 들처럼
   * 같이 따라 움직여야 하는 부수 요소를 받는다). 같은 axis 의 같은 px 변위가 적용된다.
   */
  extras?: HTMLElement[]
}

/**
 * 리스트 실시간 스왑을 시작한다(임계값 없음 — 호출자가 클릭/드래그를 구분). 세로(기본) 또는 가로 축.
 * - items: 화면 순서대로의 행/블록/컬럼 DOM(연속 형제 권장).
 * - fromIndex: 드래그 시작 항목 인덱스.
 * - startY|startX: 포인터를 처음 누른 좌표(축에 맞게). currentY|currentX: 첫 변위 계산용(생략 시 start).
 * - axis: 'y'(기본, 행/블록) | 'x'(컬럼).
 * - onCommit(from, to): 빠져나간 뒤 기준(reorderArray 규약)의 to 로 호출. 안 움직였으면 호출 안 함.
 * - draggingClass: 드래그 중 떠 있는 항목에 붙일 클래스(선택).
 */
export function beginListReorder(opts: {
  items: ListReorderItem[]
  fromIndex: number
  /** Y 시작값 — axis='y' 일 때 필수. axis='x' 면 무시. */
  startY?: number
  currentY?: number
  /** X 시작값 — axis='x' 일 때 필수. axis='y' 면 무시. */
  startX?: number
  currentX?: number
  axis?: 'x' | 'y'
  onCommit: (from: number, to: number) => void
  draggingClass?: string
}): void {
  const { items, fromIndex, onCommit, draggingClass, axis = 'y' } = opts
  const n = items.length
  if (fromIndex < 0 || fromIndex >= n || n < 2) return
  const start = axis === 'y' ? (opts.startY ?? 0) : (opts.startX ?? 0)
  const current = axis === 'y' ? (opts.currentY ?? start) : (opts.currentX ?? start)

  const rects = items.map((it) => it.dom.getBoundingClientRect())
  const starts = rects.map((r) => (axis === 'y' ? r.top : r.left))
  const sizes = rects.map((r) => (axis === 'y' ? r.height : r.width))
  const gap = n > 1 ? Math.max(0, starts[1] - (starts[0] + sizes[0])) : 0

  const prevUserSelect = document.body.style.userSelect
  const prevCursor = document.body.style.cursor
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'

  const dragged = items[fromIndex].dom
  dragged.style.position = 'relative'
  dragged.style.zIndex = '30'
  dragged.style.transition = 'none'
  if (draggingClass) dragged.classList.add(draggingClass)

  let ins = fromIndex

  const translate = (px: number) => (axis === 'y' ? `translateY(${px}px)` : `translateX(${px}px)`)

  /** 한 항목의 모든 DOM(주된 + extras)에 동일 transform 을 적용한다. transition 은 비-드래그 항목에만. */
  const applyOne = (i: number, t: string, withTransition: boolean) => {
    const all = [items[i].dom, ...(items[i].extras ?? [])]
    for (const el of all) {
      if (withTransition) el.style.transition = SHIFT_TRANSITION
      el.style.transform = t
    }
  }

  const apply = (delta: number) => {
    const res = computeReorder(starts, sizes, gap, fromIndex, delta)
    ins = res.ins
    for (let i = 0; i < n; i++) {
      if (i === fromIndex) {
        applyOne(i, translate(delta), false)
      } else {
        applyOne(i, res.offsets[i] ? translate(res.offsets[i]) : '', true)
      }
    }
  }

  const clearStyles = () => {
    for (const it of items) {
      for (const el of [it.dom, ...(it.extras ?? [])]) {
        el.style.transform = ''
        el.style.transition = ''
      }
      it.dom.style.position = ''
      it.dom.style.zIndex = ''
      if (draggingClass) it.dom.classList.remove(draggingClass)
    }
  }

  const onMove = (ev: PointerEvent) => apply((axis === 'y' ? ev.clientY : ev.clientX) - start)

  const finish = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', finish)
    document.body.style.userSelect = prevUserSelect
    document.body.style.cursor = prevCursor
    // 인라인 스타일 먼저 제거(같은 task → 중간 페인트 없음) 후 커밋 → 더블 오프셋/점프 방지.
    clearStyles()
    if (ins !== fromIndex) onCommit(fromIndex, ins)
  }

  apply(current - start)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', finish)
  window.addEventListener('pointercancel', finish)
}
