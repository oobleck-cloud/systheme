/**
 * Anatomy 기반 자동 테스트 헬퍼.
 *
 * 컴포넌트의 `*.anatomy.json` 정의를 입력으로 받아, 각 part 의 intent 에 따라
 * 적절한 Storybook play 단계(expect / userEvent)로 풀어준다. 같은 자동 검증을
 * 모든 컴포넌트에 균일하게 강제하기 위한 인프라.
 *
 * 사용법 (story 파일 안에서):
 *
 *   import anatomy from './Button.anatomy.json'
 *   import { anatomyAssertions } from '@/storybook/anatomyTest'
 *
 *   export const AnatomyDriven: Story = {
 *     play: anatomyAssertions(anatomy as AnatomyDoc, {
 *       'root': { onPress: 'onClick' },
 *     }),
 *   }
 *
 * 핵심 원칙:
 *  - Anatomy 가 진짜로 코드와 1:1 대응되는지 *런타임에서* 확인한다.
 *  - 새 part 가 anatomy 에 추가됐는데 코드에는 없으면 즉시 실패한다.
 *  - press-action / toggle / disclosure / value-input 4 가지 핵심 intent 는
 *    행동 검증까지 자동으로 수행.
 */

import { expect, userEvent, within } from '@storybook/test'

export type AnatomyPart = {
  id: string
  intent?: string
  binding?: string
  writes?: string | string[]
  emits?: string | string[]
  iterates?: string
  as?: string
  slot?: boolean
  child?: AnatomyPart
  children?: AnatomyPart[]
}

export type AnatomyDoc = {
  id: string
  state?: Record<string, string>
  events?: string[]
  anatomy: AnatomyPart
}

type AnatomyOverrides = Record<
  string,
  {
    /** 이 part 의 data-slot 명시(default: `${doc.id}-${part.id}`) */
    slotName?: string
    /** 이 part 의 root을 찾을 selector — slot 또는 role */
    selector?: string
    /** spy로 등록한 이벤트 핸들러 이름(args 의 키) */
    onPress?: string
    onToggle?: string
    onValueInput?: string
    /** 이 part 자동 검증을 건너뛴다 */
    skip?: boolean
  }
>

function flatten(
  part: AnatomyPart,
  parents: string[] = [],
): Array<{ path: string; part: AnatomyPart }> {
  const path = [...parents, part.id]
  const out = [{ path: path.join('.'), part }]
  if (part.child) out.push(...flatten(part.child, path))
  if (part.children) for (const c of part.children) out.push(...flatten(c, path))
  return out
}

/**
 * Build a play function that asserts anatomy ↔ DOM ↔ behavior coherence.
 *
 * Storybook의 `PlayFunction<Renderer, Args>` 타입은 컴포넌트마다 Args가 다르므로
 * 반환 타입을 `any`로 풀어 호환성을 확보한다(런타임 검증이 핵심).
 */

export function anatomyAssertions(doc: AnatomyDoc, overrides: AnatomyOverrides = {}): any {
  const parts = flatten(doc.anatomy)

  return async (ctx: { canvasElement: HTMLElement; args: Record<string, unknown> }) => {
    const { canvasElement, args } = ctx
    const canvas = within(canvasElement)
    const root = canvasElement

    for (const { path, part } of parts) {
      const ov = overrides[path] ?? overrides[part.id] ?? {}
      if (ov.skip) continue
      // iterates wrapper는 화면에 직접 매핑되지 않을 수 있음 — 자식만 검증
      if (part.iterates) continue

      const slotName = ov.slotName ?? `${doc.id}-${part.id}`
      const selector = ov.selector ?? `[data-slot="${slotName}"]`
      const candidate = root.querySelector(selector)

      // root part는 컴포넌트 자체이므로 root element 자체를 candidate로 본다
      const el = part.id === 'root' && !candidate ? root.firstElementChild : candidate
      if (!el) {
        // slot wrapper(슬롯만 받고 자체 노드가 없을 수 있음)는 skip 가능
        if (part.slot) continue
        throw new Error(
          `[anatomy] ${doc.id}.${path}: slot '${slotName}' 또는 selector '${selector}'에 해당하는 DOM 노드를 찾을 수 없음`,
        )
      }

      // 행동 검증
      switch (part.intent) {
        case 'press-action':
        case 'routing-link':
        case 'submit':
        case 'wizard-step':
        case 'dismiss':
        case 'stepper': {
          const handlerKey = ov.onPress ?? (typeof part.emits === 'string' ? part.emits : 'onClick')
          const spy = args[handlerKey]
          if (typeof spy === 'function' && 'mock' in (spy as object)) {
            await userEvent.click(el as HTMLElement)
            await expect(spy).toHaveBeenCalled()
          }
          break
        }
        case 'toggle': {
          const handlerKey =
            ov.onToggle ?? (typeof part.emits === 'string' ? part.emits : 'onCheckedChange')
          const spy = args[handlerKey]
          if (typeof spy === 'function' && 'mock' in (spy as object)) {
            await userEvent.click(el as HTMLElement)
            await expect(spy).toHaveBeenCalled()
          }
          break
        }
        case 'disclosure': {
          const handlerKey = typeof part.emits === 'string' ? part.emits : 'onOpenChange'
          const spy = args[handlerKey]
          if (typeof spy === 'function' && 'mock' in (spy as object)) {
            await userEvent.click(el as HTMLElement)
            await expect(spy).toHaveBeenCalled()
          }
          break
        }
        case 'value-input':
        case 'search-input': {
          const handlerKey = ov.onValueInput ?? 'onChange'
          const spy = args[handlerKey]
          if (typeof spy === 'function' && 'mock' in (spy as object)) {
            await userEvent.type(el as HTMLElement, 'a')
            await expect(spy).toHaveBeenCalled()
          }
          break
        }
      }
    }

    void canvas
  }
}
