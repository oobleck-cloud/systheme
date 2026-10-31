export const buttonColorVariants = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover focus-visible:ring-primary',
  secondary: 'bg-secondary text-secondary-fg hover:bg-secondary-hover focus-visible:ring-border',
  /* tonal — M3 filled tonal: 강조 사다리에서 primary(채움)와 secondary(무채) 사이.
   * container 쌍으로만 조합한다. 모바일 선택·연관 강조 액션용. */
  tonal:
    'bg-primary-container text-on-primary-container hover:bg-primary-container-hover focus-visible:ring-primary',
  outline: 'border border-border bg-transparent text-fg hover:bg-surface focus-visible:ring-border',
  ghost: 'text-fg hover:bg-secondary focus-visible:ring-border',
  destructive:
    'bg-destructive text-destructive-fg hover:bg-destructive-hover focus-visible:ring-destructive',
  'destructive-outline':
    'border border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-destructive-fg focus-visible:ring-destructive',
} as const
