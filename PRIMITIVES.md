# Design System Primitives — Box Language

화면에 **보이는 박스**는 `Surface`(부착)와 `Panel`(겹침) 두 primitive로 설명합니다.  
Storybook **Foundations / Box Language** 와 동기화합니다.

## Box language (public)

### Surface — 부착 in-flow

| Kind        | 용도                                | 예                                |
| ----------- | ----------------------------------- | --------------------------------- |
| `section`   | 카드·섹션·테이블 chrome             | Table, Timetable, Modal body      |
| `control`   | Input/Select 트리거, Checkbox frame | Input, Select, DatePicker trigger |
| `connected` | 단일 외곽선 공유 세그먼트           | SearchField, ButtonGroup          |

Variants: `default` | `subtle` | `inverse` | `callout` (Alert)

### Panel — 겹침 floating

| Appearance | Shape     | 용도                        |
| ---------- | --------- | --------------------------- |
| `glass`    | `overlay` | Menu, Popover               |
| `glass`    | `list`    | Select, RichList, 검색 결과 |
| `solid`    | `compact` | Tooltip, Toast, Snackbar    |
| `solid`    | `dialog`  | Modal, CommandPalette       |
| `solid`    | `edge-*`  | Drawer                      |

Position: `absolute` | `fixed` · Offset: `anchored` | `none`

## Implementation (internal)

### Box

- Panel의 스크롤 영역 + 하단 scroll hint
- `RichList` embedded 모드 등 예외적 직접 사용
- **새 feature에서 Box만으로 box chrome 만들지 말 것** → Panel 또는 Surface

## Orchestration (박스 언어 밖)

| Primitive              | 역할                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `OverlayScrim`         | Modal/Drawer/Lightbox dimmer (박스 아님)                      |
| `DropdownPopover`      | 앵커 open/close + outside dismiss                             |
| `anchorPopover` hooks  | `usePointerDownOutside`, `useDismissOnEscape`, `useFocusTrap` |
| `useAnchoredPanel`     | 트리거 앵커 + `body` 포털 fixed 위치계산 (overflow clip 회피) |
| `AnchorContextSurface` | 커스텀 trigger + Panel                                        |
| `Dropdown`             | L1 disclosure + Panel                                         |

Portal root, body scroll lock → L2(Modal/Drawer) 로컬.

## Out of scope (통일하지 않음)

- **Animation / timing** — Tooltip hover delay, drawer slide 등 L2 로컬
- **Loading scrim** — Table loading overlay (orchestration)
- **Dashed drop zones** — FileInput, ImportWizard
- **Micro chrome** — Badge, Chip, Step indicator

## Composition recipes

```
Select     = Surface(control) + Panel(glass list) + DropdownPopover
Tooltip    = Panel(solid compact)
Modal      = Portal + OverlayScrim + Panel(solid dialog) + Surface(section)
Drawer     = Portal + OverlayScrim + Panel(solid edge) + Surface(section)
Table      = Surface(section)
```

## Migration status

| PR  | Scope                             | Status |
| --- | --------------------------------- | ------ |
| PR1 | Docs + catalog                    | done   |
| PR2 | Surface primitives + control kind | done   |
| PR3 | Panel solid + OverlayScrim        | done   |
| PR4 | Floating L2                       | done   |
| PR5 | Modal/Drawer                      | done   |
| PR6 | Attached L2                       | done   |
| PR7 | SearchField + governance          | done   |

## Deprecated aliases (transitional)

- `inputVariants` → `surfaceControlVariants`
- `checkboxControlFrameVariants` → `surfaceCheckboxFrameVariants`
- `ConnectedBox` → `Surface` kind=`connected`
- Panel `variant` prop → `appearance` + `shape`
- `drawerPanelVariants` → `panelVariants`

제거 예정: 2 release 후.

## References

- [`src/foundations/BoxLanguage.stories.tsx`](src/foundations/BoxLanguage.stories.tsx)
- [`.cursor/rules/design-system.mdc`](../.cursor/rules/design-system.mdc) §11
