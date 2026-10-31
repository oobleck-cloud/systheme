import type { Meta } from '@storybook/react'

/**
 * Appends a fenced JSON "Anatomy" block to Storybook Docs (`parameters.docs.description.component`).
 * Preserves any existing `description.component` markdown string.
 *
 * **Mutates `meta` in place** so story files can keep `export default meta` — Storybook's CSF
 * indexer requires the default export to be an identifier bound to an object literal, not a
 * function call like `export default mergeAnatomyMeta(...)`.
 */
export function mergeAnatomyMeta<T>(meta: Meta<T>, anatomy: Record<string, unknown>): void {
  const block = `### Anatomy\n\n\`\`\`json\n${JSON.stringify(anatomy, null, 2)}\n\`\`\``
  const desc = meta.parameters?.docs?.description
  let prev = ''
  if (typeof desc === 'object' && desc !== null && 'component' in desc) {
    const c = (desc as { component?: unknown }).component
    prev = typeof c === 'string' ? c : ''
  }
  meta.parameters = {
    ...meta.parameters,
    docs: {
      ...meta.parameters?.docs,
      description: {
        ...(typeof desc === 'object' && desc !== null ? (desc as object) : {}),
        component: [block, prev].filter(Boolean).join('\n\n'),
      },
    },
  }
}
