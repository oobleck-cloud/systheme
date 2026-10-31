/**
 * createTypoSlots — compound slot factory for typography inside panel components.
 *
 * Architecture
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. TYPO_SLOT_DEFAULTS   — global vocabulary: { Title, Description, Label, … }
 *                           Each entry defines a default HTML tag + token classes.
 *
 * 2. createTypoSlots(names, overrides?)
 *                         — merges per-component overrides with defaults,
 *                           returns a plain object of forwardRef components.
 *                           Overrides use tailwind-merge so you only need to
 *                           specify what changes (e.g. 'text-primary' overrides
 *                           the color while keeping size/weight from the default).
 *
 * 3. WithTypoSlots<T>     — contract type. Attach via `satisfies` on the final
 *                           compound object so missing slots become compile errors.
 *
 * Usage
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   // Step A — declare which slots this component requires
 *   type MySlots = 'Title' | 'Description' | 'Caption'
 *
 *   // Step B — generate; override only what differs from the global default
 *   const MyCompound = typoContainer(
 *     MyRoot,
 *     ['Title', 'Description', 'Caption'] as const,
 *     { Title: { as: 'h4' }, Caption: { className: 'text-xs text-error-text' } },
 *   )
 *   //  TS error if slot list doesn't match WithTypoSlots inference when you annotate:
 *   //  const MyCompound: typeof MyRoot & WithTypoSlots<'Title'|'Body'> = typoContainer(...)
 *   //  would fail because 'Body' is not in the slot array.
 *
 *   // Step C — use as compound component
 *   <MyCompound>
 *     <MyCompound.Title>Heading</MyCompound.Title>
 *     <MyCompound.Description>Body text</MyCompound.Description>
 *     <MyCompound.Caption className="mt-2">Footnote</MyCompound.Caption>
 *   </MyCompound>
 *
 * Consumers can still pass className to any slot — it merges on top of the
 * component-level override which itself merged on top of the global default.
 */

import { forwardRef } from 'react'

import { cn } from './cn'

// ── 1. Slot definition ────────────────────────────────────────────────────────

export type TypoSlotDef = {
  /** Default HTML element rendered when `as` prop is not provided */
  as: keyof React.JSX.IntrinsicElements
  /** Token-based Tailwind classes (merged via twMerge with any override/className) */
  className: string
}

// ── 2. Global vocabulary ──────────────────────────────────────────────────────

/**
 * DS-wide default for each semantic slot.
 * Adding a key here automatically extends `TypoSlotName`.
 */
export const TYPO_SLOT_DEFAULTS = {
  /** Primary label / card heading */
  Title: {
    as: 'p',
    className: 'text-sm font-semibold text-fg leading-snug',
  },
  /** Supporting body text — one step below Title (text-sm) */
  Description: {
    as: 'p',
    className: 'text-xs text-fg-subtle leading-snug',
  },
  /** Short inline identifier or field label */
  Label: {
    as: 'span',
    className: 'text-xs font-medium text-fg-subtle leading-none',
  },
  /** Supplementary detail, footnote-level */
  Caption: {
    as: 'p',
    className: 'text-xs text-fg-muted leading-snug',
  },
  /** Timestamps, counts — monospaced rhythm */
  Metadata: {
    as: 'span',
    className: 'text-xs tabular-nums text-fg-subtle leading-none',
  },
} satisfies Record<string, TypoSlotDef>

/** All valid slot names derived directly from the defaults object */
export type TypoSlotName = keyof typeof TYPO_SLOT_DEFAULTS

// ── 3. Component types ────────────────────────────────────────────────────────

export type TypoSlotProps = React.HTMLAttributes<HTMLElement> & {
  /** Override the default HTML element for this slot instance */
  as?: keyof React.JSX.IntrinsicElements
}

export type TypoSlotComponent = React.ForwardRefExoticComponent<
  TypoSlotProps & React.RefAttributes<HTMLElement>
>

// ── 4. Contract type ──────────────────────────────────────────────────────────

/**
 * `satisfies` target.
 * Apply to any compound component that must expose the listed slots:
 *
 *   const Foo = Object.assign(FooRoot, slots)
 *     satisfies typeof FooRoot & WithTypoSlots<'Title' | 'Description'>
 */
export type WithTypoSlots<T extends TypoSlotName> = {
  [K in T]: TypoSlotComponent
}

// ── 5. Factory ────────────────────────────────────────────────────────────────

/**
 * Generates a `{ [SlotName]: ForwardRefComponent }` record.
 *
 * @param slotNames  - tuple/array of slot keys to create (use `as const`)
 * @param overrides  - per-slot partial overrides; className merges via twMerge
 *                     so you only need to specify what differs from the default
 */
export function createTypoSlots<T extends TypoSlotName>(
  slotNames: readonly T[],
  overrides?: { readonly [K in T]?: Partial<TypoSlotDef> },
): { [K in T]: TypoSlotComponent } {
  const entries = slotNames.map((name) => {
    const base = TYPO_SLOT_DEFAULTS[name]
    const override = overrides?.[name]

    const resolvedAs = override?.as ?? base.as
    // twMerge handles conflicts: 'text-primary' beats 'text-fg', 'text-xs' beats 'text-sm', etc.
    const resolvedClassName = cn(base.className, override?.className)

    const Slot = forwardRef<HTMLElement, TypoSlotProps>(
      ({ as: Tag = resolvedAs, className, ...props }, ref) => {
        const C = Tag as React.ElementType
        return <C ref={ref} className={cn(resolvedClassName, className)} {...props} />
      },
    )
    Slot.displayName = `TypoSlot(${name})`

    return [name, Slot] as const
  })

  return Object.fromEntries(entries) as { [K in T]: TypoSlotComponent }
}

// ── 6. One-call compound wrapper ─────────────────────────────────────────────

/**
 * Merges a root component with typography slots in a single expression.
 *
 * Equivalent to:
 *   `Object.assign(root, createTypoSlots(slots, overrides)) as Root & WithTypoSlots<…>`
 *
 * To **enforce** a slot contract at the call site, annotate the result:
 *
 *   const Surface: typeof SurfaceRoot & WithTypoSlots<'Title' | 'Body'> =
 *     typoContainer(SurfaceRoot, ['Title', 'Body'] as const)
 */
export function typoContainer<Root extends object, const Slots extends readonly TypoSlotName[]>(
  root: Root,
  slots: Slots,
  overrides?: { readonly [K in Slots[number]]?: Partial<TypoSlotDef> },
): Root & WithTypoSlots<Slots[number]> {
  return Object.assign(root, createTypoSlots(slots, overrides)) as Root &
    WithTypoSlots<Slots[number]>
}
