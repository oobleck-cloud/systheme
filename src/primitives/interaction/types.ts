export type InteractionContextKind =
  | 'document'
  | 'list'
  | 'linear'
  | 'grid'
  | 'pane-stack'
  | 'tree'
  | 'field'
  | 'range'
  | 'overlay'

export type TraversalAxis = 'inline' | 'block' | 'both'

export type InteractionIntent =
  | {
      type:
        | 'nav.next'
        | 'nav.prev'
        | 'nav.first'
        | 'nav.last'
        | 'nav.pageNext'
        | 'nav.pagePrev'
        | 'nav.up'
        | 'nav.down'
        | 'nav.left'
        | 'nav.right'
        | 'nav.crossNext'
        | 'nav.crossPrev'
      extend?: boolean
    }
  | {
      type:
        | 'activate'
        | 'confirm'
        | 'cancel'
        | 'toggle'
        | 'contextMenu'
        | 'remove'
        | 'expand'
        | 'collapse'
    }
  | { type: 'step'; delta: 1 | -1 }
  | { type: 'edit.commit' | 'edit.cancel' }
