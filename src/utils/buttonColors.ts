export const buttonColorVariants = {
  /* 채운 버튼의 비활성은 흐린 원색이 아니라 회색 컨테이너(Fab 과 같은 짝) — 흐린 파랑은 고장으로 읽힌다. */
  primary:
    'bg-primary text-primary-fg hover:bg-primary-hover focus-visible:ring-primary disabled:bg-disabled-container disabled:text-on-disabled disabled:opacity-100',
  secondary: 'bg-secondary text-secondary-fg hover:bg-secondary-hover focus-visible:ring-border',
  /* tonal — M3 filled tonal: 강조 사다리에서 primary(채움)와 secondary(무채) 사이.
   * container 쌍으로만 조합한다. 모바일 선택·연관 강조 액션용. */
  tonal:
    'bg-primary-container text-on-primary-container hover:bg-primary-container-hover focus-visible:ring-primary disabled:bg-disabled-container disabled:text-on-disabled disabled:opacity-100',
  outline: 'border border-border bg-transparent text-fg hover:bg-surface focus-visible:ring-border',
  ghost: 'text-fg hover:bg-secondary focus-visible:ring-border',
  destructive:
    'bg-destructive text-destructive-fg hover:bg-destructive-hover focus-visible:ring-destructive disabled:bg-disabled-container disabled:text-on-disabled disabled:opacity-100',
  'destructive-outline':
    'border border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-destructive-fg focus-visible:ring-destructive',
} as const
