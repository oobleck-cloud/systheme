'use client'

// TagSelect — 노션식 태그/옵션 셀렉트.
//
// `MultiSelect` 와 역할이 다르다: MultiSelect 는 "고정된 옵션 집합에서 고르는 폼 필드"이고,
// TagSelect 는 "옵션 집합 자체를 그 자리에서 만들고 지우고 색을 바꾸는" 노션 DB 셀이다.
// 그래서 creatable(자유 생성)·locked(고정 enum)·colorize(값 해시 색)·single(교체형)·
// onOptionsChange(옵션 정의 영속)·panelPlacement='overlay'(셀 위 확대 편집)를 갖는다.
//
// 두 컴포넌트를 합치지 않은 이유: 패널 기질이 다르다
// (MultiSelect = DropdownPopover + useAnchoredPanel, TagSelect = AnchorContextSurface).
// 합치면 이미 MultiSelect 를 쓰는 폼 화면들의 패널 동작·VR 스냅샷이 함께 바뀐다.
// 수렴은 별도 슬라이스로 다룬다.

import { type VariantProps } from 'class-variance-authority'
import { useId, useRef, useState } from 'react'

import { inputVariants } from '@/components/Input'
import { Tag, type TagColor } from '@/components/Tag'
import { useInteractionContext } from '@/primitives/interaction'
import { AnchorContextSurface } from '@/primitives/anchorContextSurface'
import { beginListReorder, reorderArray } from '@/primitives/listReorder'
import { cn } from '@/utils/cn'
import { ChevronLeft, Check, GripVertical, MoreHorizontal, Trash2 } from '@/icons'
import {
  dropdownListShellVariants,
  dropdownOptionDensityVariants,
  dropdownSearchPaddingVariants,
} from '@/utils/dropdownDensity'

export type TagSelectOption = {
  value: string
  label: string
  disabled?: boolean
  /** 옵션 색(노션식, DS Tag color 이름). 미지정 시 값 해시 색. */
  color?: string
}

type TagSelectProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  Pick<VariantProps<typeof inputVariants>, 'variant' | 'chrome' | 'size'> &
  Pick<VariantProps<typeof dropdownListShellVariants>, 'density'> & {
    options: TagSelectOption[]
    value?: string[]
    onChange?: (value: string[]) => void
    onOpenChange?: (open: boolean) => void
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
    /** 자유 입력 — 검색어를 새 값(태그)으로 생성. 켜면 입력칸이 항상 표시되고 Enter/'추가'로 값에 더한다. */
    creatable?: boolean
    /** 노션식 색 칩 — 값마다 해시로 안정적인 색을 배정한다(태그 멀티셀렉트용). */
    colorize?: boolean
    /**
     * 단일 선택 모드(노션 select) — 옵션 선택 시 기존 값을 "교체"하고 패널을 닫는다.
     * 기본(false)은 다중 선택(노션 multi-select): 토글로 "추가"하고 패널은 열린 채 유지.
     * UI·인터랙션 언어는 동일하고 submit 동작(교체 vs 추가)만 다르다.
     */
    single?: boolean
    /**
     * 옵션 집합 잠금(노션 고정 enum) — true 면 옵션 생성·삭제·순서변경 불가(선택만).
     * creatable·onOptionsChange 가 있어도 잠금이면 편집 UI(생성/드래그/삭제)를 숨긴다.
     */
    locked?: boolean
    /**
     * 옵션 정의 변경 콜백(순서변경·삭제·생성) — 노션식 옵션 관리. 지정 + 미잠금일 때만 옵션 행에
     * 드래그 핸들·삭제가 보이고, 생성 시 옵션 집합에도 추가된다. 상위가 컬렉션 스키마에 영속한다.
     */
    onOptionsChange?: (options: TagSelectOption[]) => void
    /**
     * 옵션 색만 바꾸는 콜백 — 잠긴 옵션 집합(서버가 정한 enum)도 색은 팀이 고른다.
     * 지정하면 잠금이어도 옵션 행에 ⋯ 가 보이고, 편집 패널은 이름·삭제 없이 색만 보인다.
     * 미지정이면 색 변경도 `onOptionsChange` 로 간다(편집형 옵션).
     */
    onOptionColorChange?: (value: string, color: string | undefined) => void
    /** 패널 배치 — 표 셀 편집은 'overlay'(셀 위 확대). 기본 'below'. */
    panelPlacement?: 'below' | 'right' | 'overlay'
    /** 패널 추가 클래스 — 셀 편집 공용 링 등. */
    panelClassName?: string
  }

/** 값 문자열 → 안정적인 태그 색(해시). 같은 값은 항상 같은 색(노션식). */
const TAG_PALETTE: TagColor[] = ['gray', 'blue', 'green', 'orange', 'red', 'purple', 'teal']
function tagColorFor(v: string): TagColor {
  let h = 0
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}
/** 옵션 color(string) → 유효한 TagColor 만 통과(아니면 undefined → 해시 폴백). */
function asTagColor(c: string | undefined): TagColor | undefined {
  return c && (TAG_PALETTE as string[]).includes(c) ? (c as TagColor) : undefined
}

/** 옵션 편집 패널 — 이름 변경 + 삭제 + 색상 선택. 견본은 칩의 점과 같은 색이다. */
const OPTION_COLOR_ENTRIES: { value: TagColor | undefined; label: string; swatch: string }[] = [
  { value: undefined, label: '기본', swatch: 'border border-fg-muted/50' },
  { value: 'gray', label: '회색', swatch: 'bg-tag-gray-dot' },
  { value: 'blue', label: '파랑', swatch: 'bg-tag-blue-dot' },
  { value: 'green', label: '초록', swatch: 'bg-tag-green-dot' },
  { value: 'orange', label: '주황', swatch: 'bg-tag-orange-dot' },
  { value: 'red', label: '빨강', swatch: 'bg-tag-red-dot' },
  { value: 'purple', label: '보라', swatch: 'bg-tag-purple-dot' },
  { value: 'teal', label: '청록', swatch: 'bg-tag-teal-dot' },
]

type OptionEditMode = { kind: 'list' } | { kind: 'edit'; optValue: string }

function TagSelect({
  className,
  variant,
  chrome,
  size = 'md',
  options,
  value: controlledValue,
  onChange,
  onOpenChange,
  placeholder = '선택...',
  disabled = false,
  searchable = false,
  creatable = false,
  colorize = false,
  single = false,
  locked = false,
  onOptionsChange,
  onOptionColorChange,
  density,
  panelPlacement,
  panelClassName,
  ...props
}: TagSelectProps) {
  // 옵션 집합 편집(드래그 정렬·삭제·생성) 가능 여부 — 콜백 있고 잠기지 않았을 때만.
  const editableOptions = !!onOptionsChange && !locked
  // 색은 잠금과 무관하게 바꿀 수 있다 — 전용 콜백이 있거나 편집형 옵션이면.
  const colorEditable = colorize && (!!onOptionColorChange || editableOptions)
  // 잠금이면 생성도 막는다(고정 enum).
  const canCreateOpt = creatable && !locked
  const den = density ?? 'default'
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalValue, setInternalValue] = useState<string[]>([])
  const [optEditMode, setOptEditMode] = useState<OptionEditMode>({ kind: 'list' })
  const [optLabelDraft, setOptLabelDraft] = useState('')

  const listboxId = useId()

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue! : internalValue

  const filteredOptions =
    searchable && search
      ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
      : options

  // Refs for stable access inside onIntent callback
  const filteredOptionsRef = useRef(filteredOptions)
  filteredOptionsRef.current = filteredOptions
  const focusedIndexRef = useRef(0)

  const { contextProps, getItemProps, focusedIndex, setFocusedIndex } = useInteractionContext({
    kind: 'list',
    itemCount: filteredOptions.length,
    onIntent: (intent) => {
      const opts = filteredOptionsRef.current
      const currentIdx = focusedIndexRef.current
      switch (intent.type) {
        case 'nav.next':
          setFocusedIndex(Math.min(currentIdx + 1, opts.length - 1))
          return true
        case 'nav.prev':
          setFocusedIndex(Math.max(currentIdx - 1, 0))
          return true
        case 'nav.first':
          setFocusedIndex(0)
          return true
        case 'nav.last':
          setFocusedIndex(opts.length - 1)
          return true
        case 'cancel':
          handleOpenChange(false)
          return true
        default:
          return false
      }
    },
  })

  // Keep focusedIndexRef in sync with hook state
  focusedIndexRef.current = focusedIndex

  function handleOpenChange(next: boolean) {
    setIsOpen(next)
    onOpenChange?.(next)
    if (!next) {
      setSearch('')
      setFocusedIndex(0)
      setOptEditMode({ kind: 'list' })
    }
  }

  function commitValue(next: string[]) {
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  function removeValue(v: string) {
    commitValue(value.filter((x) => x !== v))
  }

  function toggleOption(optValue: string) {
    if (single) {
      // 단일 선택(노션 select): 교체 + 닫기.
      commitValue([optValue])
      handleOpenChange(false)
      return
    }
    // 다중 선택(노션 multi): 토글(추가/제거), 패널 유지.
    commitValue(
      value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue],
    )
  }

  // creatable — 검색어가 기존 옵션/값과 겹치지 않으면 새 값으로 생성 가능. 잠금이면 생성 불가.
  const trimmed = search.trim()
  const canCreate =
    canCreateOpt &&
    trimmed.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === trimmed.toLowerCase())
  function commitCreate() {
    if (!trimmed) return
    // 편집 가능하면 옵션 집합에도 새 옵션 추가(영속) — 노션처럼 생성 = 옵션 정의 추가.
    if (editableOptions && !options.some((o) => o.value === trimmed)) {
      onOptionsChange?.([
        ...options,
        { value: trimmed, label: trimmed, color: tagColorFor(trimmed) },
      ])
    }
    if (single) {
      commitValue([trimmed])
      setSearch('')
      handleOpenChange(false)
      return
    }
    if (!value.includes(trimmed)) commitValue([...value, trimmed])
    setSearch('')
  }

  /** 옵션 삭제(편집형) — 집합에서 제거 + 선택돼 있으면 값에서도 제거. */
  function deleteOption(optValue: string) {
    onOptionsChange?.(options.filter((o) => o.value !== optValue))
    if (value.includes(optValue)) commitValue(value.filter((x) => x !== optValue))
  }

  // 옵션 행 드래그 정렬(편집형, 검색 중 아닐 때만 — 인덱스가 전체 options 와 일치). 공용 엔진의 '비켜나는 스왑'.
  const optionRowEls = useRef<(HTMLElement | null)[]>([])
  const startOptionDrag = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const list: { dom: HTMLElement }[] = []
    for (let idx = 0; idx < options.length; idx++) {
      const el = optionRowEls.current[idx]
      if (!el) return
      list.push({ dom: el })
    }
    beginListReorder({
      items: list,
      fromIndex: i,
      startY: e.clientY,
      currentY: e.clientY,
      onCommit: (from, to) => onOptionsChange?.(reorderArray(options, from, to)),
    })
  }

  function handleTriggerClick() {
    if (disabled) return
    handleOpenChange(!isOpen)
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleOpenChange(!isOpen)
        break
      case 'Escape':
        handleOpenChange(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          handleOpenChange(true)
        } else {
          setFocusedIndex(
            Math.min(focusedIndexRef.current + 1, filteredOptionsRef.current.length - 1),
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(Math.max(focusedIndexRef.current - 1, 0))
        break
    }
  }

  const minHClass =
    size === 'sm' ? 'min-h-8 py-1' : size === 'lg' ? 'min-h-12 py-2.5' : 'min-h-10 py-2'

  const tagSize = size === 'lg' ? 'md' : 'sm'

  const surface = (
    <div
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      // listbox 는 열렸을 때만(포털) 존재 → 닫힘 상태에서 id 를 SSR 에 렌더하지 않아 하이드레이션 불일치 방지.
      aria-controls={isOpen ? listboxId : undefined}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleTriggerClick}
      onKeyDown={handleTriggerKeyDown}
      className={cn(
        inputVariants({ variant, chrome, size }),
        'flex h-auto cursor-pointer flex-wrap items-center gap-1.5',
        minHClass,
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {value.length > 0 ? (
        // value 기준으로 렌더 — 옵션에 없는 자유 입력 태그도 칩으로 보이게(creatable). 라벨은 옵션 라벨 우선.
        value.map((v) => {
          const opt = options.find((o) => o.value === v)
          return (
            <Tag
              key={v}
              size={tagSize}
              color={colorize ? (asTagColor(opt?.color) ?? tagColorFor(v)) : undefined}
              onRemove={() => removeValue(v)}
            >
              {opt?.label ?? v}
            </Tag>
          )
        })
      ) : (
        <span className="text-fg-muted">{placeholder}</span>
      )}

      <span
        className={cn(
          'ml-auto flex shrink-0 items-center text-fg-muted transition-transform',
          isOpen && 'rotate-180',
        )}
        aria-hidden="true"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </span>
    </div>
  )

  // 옵션 편집 모드 — 이름 변경 + 색상 + 삭제.
  const editingOpt =
    optEditMode.kind === 'edit' ? options.find((o) => o.value === optEditMode.optValue) : undefined

  function changeOptionColor(optValue: string, color: TagColor | undefined) {
    if (onOptionColorChange) onOptionColorChange(optValue, color)
    else onOptionsChange?.(options.map((o) => (o.value === optValue ? { ...o, color } : o)))
  }

  const backButton = (
    <button
      type="button"
      aria-label="목록으로 돌아가기"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setOptEditMode({ kind: 'list' })}
      className="flex size-6 shrink-0 items-center justify-center rounded text-fg-muted transition-colors hover:bg-surface hover:text-fg"
    >
      <ChevronLeft className="size-3.5" aria-hidden />
    </button>
  )

  const optEditPanel = editingOpt ? (
    <div className="min-w-[13rem]">
      {editableOptions ? (
        <>
          {/* 뒤로 + 이름 입력 */}
          <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
            {backButton}
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus -- 옵션 이름 편집: 사용자가 연 패널, 바로 입력이 기대 동작
              autoFocus
              type="text"
              value={optLabelDraft}
              onChange={(e) => setOptLabelDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  const trimmed = optLabelDraft.trim()
                  if (trimmed) {
                    onOptionsChange?.(
                      options.map((o) =>
                        o.value === editingOpt.value ? { ...o, label: trimmed } : o,
                      ),
                    )
                  }
                  setOptEditMode({ kind: 'list' })
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setOptEditMode({ kind: 'list' })
                }
              }}
              placeholder="옵션 이름"
              className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
            />
          </div>
          {/* 삭제 */}
          <div className="p-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                deleteOption(editingOpt.value)
                setOptEditMode({ kind: 'list' })
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-error transition-colors hover:bg-error/10"
            >
              <Trash2 className="size-4" aria-hidden />
              삭제
            </button>
          </div>
          <div className="mx-3 border-t border-border" />
        </>
      ) : (
        // 잠긴 옵션 — 이름·삭제는 서버가 정한다. 무엇의 색을 고르는지만 보인다.
        <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
          {backButton}
          <Tag size="sm" color={asTagColor(editingOpt.color) ?? tagColorFor(editingOpt.value)}>
            {editingOpt.label}
          </Tag>
        </div>
      )}
      {/* 색상 선택 */}
      {colorize && (
        <>
          <div className="px-3 pb-1 pt-2 text-xs font-medium text-fg-muted">색상</div>
          <div className="px-1 pb-1">
            {OPTION_COLOR_ENTRIES.map((c) => {
              const isCurrent =
                c.value === undefined ? !asTagColor(editingOpt.color) : editingOpt.color === c.value
              return (
                <button
                  key={c.value ?? 'default'}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    changeOptionColor(editingOpt.value, c.value)
                    setOptEditMode({ kind: 'list' })
                  }}
                  className="flex w-full items-center gap-2.5 rounded px-2 py-1 text-left text-sm text-fg transition-colors hover:bg-surface"
                >
                  <span className={cn('size-2.5 shrink-0 rounded-full', c.swatch)} />
                  <span className="flex-1">{c.label}</span>
                  {isCurrent && <Check className="size-3.5 text-fg-muted" aria-hidden />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  ) : null

  const panel =
    optEditMode.kind === 'edit' ? (
      optEditPanel
    ) : (
      <>
        {/* 토큰 필드(노션식) — 선택 칩 + 인라인 검색/생성 입력. 오버레이로 트리거가 가려지므로
          여기서 현재 선택을 보고 X 로 제거한다. select·multi 가 동일한 헤더를 공유. */}
        {(value.length > 0 || searchable || canCreateOpt) && (
          <div
            className={cn(
              dropdownSearchPaddingVariants({ density: den }),
              'flex flex-wrap items-center gap-1.5',
            )}
          >
            {value.map((v) => {
              const opt = options.find((o) => o.value === v)
              return (
                <Tag
                  key={v}
                  size="sm"
                  color={colorize ? (asTagColor(opt?.color) ?? tagColorFor(v)) : undefined}
                  onRemove={() => removeValue(v)}
                >
                  {opt?.label ?? v}
                </Tag>
              )
            })}
            {(searchable || canCreateOpt) && (
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus -- dropdown search: user initiated open, immediate focus is expected UX
                autoFocus
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setFocusedIndex(0)
                }}
                onKeyDown={(e) => {
                  // 입력칸이 listbox 의 형제라 키 이벤트가 listbox 로 안 감 → 내비/확정을 여기서 처리.
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    handleOpenChange(false)
                    return
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setFocusedIndex(
                      Math.min(focusedIndexRef.current + 1, filteredOptionsRef.current.length - 1),
                    )
                    return
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setFocusedIndex(Math.max(focusedIndexRef.current - 1, 0))
                    return
                  }
                  // Enter: 생성 가능하면 새 값(노션식), 아니면 포커스된 옵션 선택. 한글 IME 조합 중엔 무시.
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    if (canCreate) {
                      commitCreate()
                      return
                    }
                    const opt = filteredOptionsRef.current[focusedIndexRef.current]
                    if (opt && !opt.disabled) toggleOption(opt.value)
                  }
                }}
                aria-label="옵션 선택 또는 생성"
                className="min-w-[6rem] flex-1 bg-transparent text-sm outline-none placeholder:text-fg-muted"
                placeholder={canCreateOpt ? '옵션 선택 또는 생성' : '옵션 검색'}
              />
            )}
          </div>
        )}

        {/* creatable: 새 값 생성 행(노션식 "추가") — 검색어가 기존과 안 겹칠 때만. */}
        {canCreate && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commitCreate}
            className={cn(
              dropdownOptionDensityVariants({ density: den }),
              'flex w-full cursor-pointer items-center gap-2 text-left transition-colors hover:bg-surface',
            )}
          >
            <span className="text-sm text-fg-muted">추가</span>
            <Tag size="sm" color={colorize ? tagColorFor(trimmed) : undefined}>
              {trimmed}
            </Tag>
          </button>
        )}

        {/* contextProps provides role="listbox", aria-orientation, onKeyDown (nav + cancel) */}
        <ul
          data-slot="panel-scroll-region"
          id={listboxId}
          role="listbox"
          aria-label="옵션 목록"
          aria-multiselectable={single ? 'false' : 'true'}
          {...contextProps}
          className={dropdownListShellVariants({ density: den })}
        >
          {filteredOptions.length === 0 ? (
            creatable ? null : (
              <li
                role="option"
                aria-selected="false"
                className={cn(dropdownOptionDensityVariants({ density: den }), 'text-fg-muted')}
              >
                옵션 없음
              </li>
            )
          ) : (
            filteredOptions.map((opt, i) => {
              const isSelected = value.includes(opt.value)
              const itemProps = getItemProps(i)
              // 편집 행(드래그·삭제)은 검색 중이 아닐 때만 — 인덱스가 전체 options 와 일치(폴더링 시 어긋남 방지).
              const showEdit = editableOptions && !search
              return (
                <li
                  key={opt.value}
                  ref={(el) => {
                    optionRowEls.current[i] = el
                  }}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  tabIndex={opt.disabled ? -1 : itemProps.tabIndex}
                  onClick={() => {
                    if (!opt.disabled) {
                      setFocusedIndex(i)
                      toggleOption(opt.value)
                    }
                  }}
                  onFocus={itemProps.onFocus}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      // stopPropagation so the ul's contextProps.onKeyDown doesn't double-fire
                      e.stopPropagation()
                      if (!opt.disabled) toggleOption(opt.value)
                    }
                    // Escape bubbles to ul's contextProps → cancel intent → close
                  }}
                  className={cn(
                    'group/opt flex cursor-pointer items-center gap-2 transition-colors outline-none select-none',
                    dropdownOptionDensityVariants({ density: den }),
                    'hover:bg-surface focus-visible:bg-surface',
                    focusedIndex === i && 'bg-surface',
                    opt.disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  {showEdit && (
                    // 순서 이동 그립 — 포인터 드래그 전용이다. `role="button"` 을 달면 스크린리더에
                    // 버튼으로 읽히는데 Enter 로는 아무 일도 안 일어나 거짓 어포던스가 된다.
                    // 그래서 보조기술에는 숨기고(aria-hidden) 시각적 그립으로만 둔다.
                    // (키보드 재정렬은 미지원 — 표 뷰의 행/컬럼 그립과 동일한 현재 한계.)
                    <span
                      aria-hidden="true"
                      onPointerDown={startOptionDrag(i)}
                      className="-ml-1 flex w-4 shrink-0 cursor-grab touch-none items-center justify-center text-fg-muted opacity-0 transition-opacity group-hover/opt:opacity-100 active:cursor-grabbing"
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                  )}
                  {/* 노션식: 옵션을 색 태그 펄로(칩과 일치). 선택 시 우측 체크. */}
                  {colorize ? (
                    <Tag size="sm" color={asTagColor(opt.color) ?? tagColorFor(opt.value)}>
                      {opt.label}
                    </Tag>
                  ) : (
                    <span className="min-w-0 truncate">{opt.label}</span>
                  )}
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    {isSelected && (
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-fg-muted"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 8l3.5 3.5 6.5-7" />
                      </svg>
                    )}
                    {(showEdit || (colorEditable && !search)) && (
                      <button
                        type="button"
                        aria-label={showEdit ? '옵션 편집' : '옵션 색 바꾸기'}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOptLabelDraft(opt.label)
                          setOptEditMode({ kind: 'edit', optValue: opt.value })
                        }}
                        className="flex size-5 items-center justify-center rounded text-fg-muted opacity-0 transition-opacity hover:bg-background hover:text-fg group-hover/opt:opacity-100"
                      >
                        <MoreHorizontal className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </span>
                </li>
              )
            })
          )}
        </ul>
      </>
    )

  return (
    <AnchorContextSurface
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={className}
      dismissOnEscape={false}
      panelMatchSurfaceWidth={optEditMode.kind === 'list'}
      panelPlacement={panelPlacement}
      panelClassName={panelClassName}
      surface={surface}
      panel={panel}
      {...props}
    />
  )
}

export { TagSelect }
export type { TagSelectProps }
