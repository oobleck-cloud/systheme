// ─── Inputs (신규) ───────────────────────────────────────────────────────────
export { Radio, radioControlFrameVariants } from './components/Radio'
export type { RadioProps } from './components/Radio'

export { RadioGroup } from './components/Radio'
export type { RadioGroupProps, RadioGroupOption } from './components/Radio'

export { RangeSlider, Slider } from './components/Slider'
export type { RangeSliderProps, RangeValue, SliderProps } from './components/Slider'

export { NumberInput } from './components/NumberInput'
export type { NumberInputProps } from './components/NumberInput'

export { FileInput } from './components/FileInput'
export type { FileInputProps } from './components/FileInput'

// ─── Feedback (신규) ─────────────────────────────────────────────────────────
export { Progress, progressFillVariants, progressTrackVariants } from './components/Progress'
export type { ProgressProps } from './components/Progress'

export { Alert, alertVariants } from './components/Alert'
export type { AlertProps, AlertSeverity } from './components/Alert'

// ─── Navigation (신규) ───────────────────────────────────────────────────────
export { Blockquote, blockquoteVariants } from './components/Blockquote'
export type { BlockquoteProps } from './components/Blockquote'
export { Breadcrumb } from './components/Breadcrumb'
export type { BreadcrumbProps, BreadcrumbItem } from './components/Breadcrumb'

export { Steps } from './components/Steps'
export type { StepsProps, StepItem, StepStatus } from './components/Steps'

// ─── Overlay (신규) ──────────────────────────────────────────────────────────
export { Popover } from './components/Popover'
export type {
  PopoverProps,
  PopoverSide,
  PopoverAlign,
  PopoverTriggerProps,
} from './components/Popover'

// ─── Toolbar (L3) ────────────────────────────────────────────────────────────
export { Toolbar, FloatingToolbar, ToolbarItem, ToolbarGroup } from './components/Toolbar'
export type {
  ToolbarProps,
  FloatingToolbarProps,
  ToolbarItemProps,
  ToolbarGroupProps,
  ToolbarItemTone,
  ToolbarDensity,
} from './components/Toolbar'

// ─── Form Layout (신규) ──────────────────────────────────────────────────────
export { FormField } from './components/FormField'
export type { FormFieldProps } from './components/FormField'
export { useFieldControl } from './utils/useFieldControl'
export type { FieldControlSurface } from './utils/useFieldControl'

// ─── Display (신규) ──────────────────────────────────────────────────────────
export { AvatarGroup } from './components/AvatarGroup'
export type { AvatarGroupProps, AvatarGroupItem } from './components/AvatarGroup'

export { Kbd } from './components/Kbd'
export type { KbdProps } from './components/Kbd'

// ─── Structure (신규) ────────────────────────────────────────────────────────
export { Accordion } from './components/Accordion'
export type { AccordionProps, AccordionItem, AccordionType } from './components/Accordion'

// ─── Layout ──────────────────────────────────────────────────────────────────
export { Stack } from './components/layout/Stack'
export type { StackProps } from './components/layout/Stack'

export { Grid } from './components/layout/Grid'
export type { GridProps } from './components/layout/Grid'

export { Container } from './components/layout/Container'
export type { ContainerProps } from './components/layout/Container'

export { Divider } from './components/layout/Divider'
export type { DividerProps } from './components/layout/Divider'

export {
  elevation,
  Surface,
  surfaceControlVariants,
  surfaceVariants,
  surfaceCheckboxFrameVariants,
} from './primitives/surface'
export type {
  ElevationVariantProps,
  SurfaceProps,
  SurfaceControlVariantProps,
  SurfaceVariantProps,
  SurfaceCheckboxFrameVariantProps,
} from './primitives/surface'

export {
  AccentStripe,
  accentStripeRootVariants,
  accentStripeBarVariants,
  accentStripeBodyVariants,
} from './components/AccentStripe'
export type { AccentStripeProps } from './components/AccentStripe'

// ─── Actions ─────────────────────────────────────────────────────────────────
export { Button, buttonVariants, ButtonGroup, buttonGroupVariants } from './components/Button'
export type {
  ButtonProps,
  ButtonGroupProps,
  ButtonGroupBoxSize,
  ButtonGroupEndShape,
} from './components/Button'

export { IconButton, iconButtonVariants } from './components/IconButton'
export type { IconButtonProps } from './components/IconButton'

export { ToggleButtonGroup, toggleButtonGroupVariants } from './components/ToggleButtonGroup'
export type {
  ToggleButtonGroupOption,
  ToggleButtonGroupProps,
} from './components/ToggleButtonGroup'

export { ImageButton, imageButtonVariants } from './components/ImageButton'
export type { ImageButtonProps } from './components/ImageButton'

export {
  KakaoLoginButton,
  kakaoLoginButtonVariants,
  KAKAO_LABELS,
  KakaoSymbol,
} from './components/KakaoLoginButton'
export type { KakaoLoginButtonProps } from './components/KakaoLoginButton'

// ─── Inputs ──────────────────────────────────────────────────────────────────
export { Input, inputVariants } from './components/Input'
export type { InputProps } from './components/Input'

export { PhoneNumberInput } from './components/PhoneNumberInput'
export type { PhoneNumberInputProps } from './components/PhoneNumberInput'

export { DateInput } from './components/DateInput'
export type { DateInputProps } from './components/DateInput'

export { BirthDateScrollPicker, ScrollWheelColumn } from './components/BirthDateScrollPicker'
export type { ScrollWheelOption } from './components/BirthDateScrollPicker'
export type { BirthDateScrollPickerProps } from './components/BirthDateScrollPicker'

export { YearMonthSelector } from './components/YearMonthSelector'
export type { YearMonthSelectorProps } from './components/YearMonthSelector'

export { formatKoreanPhoneDisplay, stripPhoneDigits } from './utils/koreanPhoneNumber'

export {
  birthDateDigitsToIso,
  BIRTH_DATE_DIGIT_LENGTH,
  formatBirthDateDisplay,
  isValidBirthDateDigits,
  stripDateDigits,
} from './utils/dateDigits'

export { Checkbox, checkboxControlFrameVariants } from './components/Checkbox'
export type { CheckboxProps, CheckboxControlFrameVariantProps } from './components/Checkbox'

export { Switch } from './components/Switch'
export type { SwitchProps } from './components/Switch'

export { Textarea, textareaVariants } from './components/Textarea'
export type { TextareaProps } from './components/Textarea'

export { Select } from './components/Select'
export type { SelectProps, SelectOption } from './components/Select'

export { MultiSelect } from './components/MultiSelect'
export type { MultiSelectProps, MultiSelectOption } from './components/MultiSelect'
export { TagSelect } from './components/TagSelect'
export type { TagSelectProps, TagSelectOption } from './components/TagSelect'

export { Calendar } from './components/Calendar'
export type { CalendarProps } from './components/Calendar'

export { MonthGrid } from './components/MonthGrid'
export type {
  MonthGridProps,
  MonthGridDayKind,
  MonthGridDayMeta,
  MonthGridDensity,
} from './components/MonthGrid'

export { DatePicker } from './components/DatePicker'
export type { DatePickerProps } from './components/DatePicker'
export { DateEditPanel, formatDisplayDate, parseDisplayDate } from './components/DatePicker'
export type { DateEditPanelProps, DateEditValue } from './components/DatePicker'

export { TimePicker } from './components/TimePicker'
export type { TimePickerProps } from './components/TimePicker'

export { EmojiPicker, DEFAULT_EMOJI_CATEGORIES } from './components/EmojiPicker'
export type {
  EmojiPickerProps,
  EmojiPickerCategory,
  EmojiPickerItem,
} from './components/EmojiPicker'

export { SearchField, searchFieldVariants } from './components/SearchField'
export type { SearchFieldProps, SearchFieldSubmitLayout } from './components/SearchField'

export { SearchFieldAutocomplete } from './components/SearchFieldAutocomplete'
export type {
  SearchFieldAutocompleteOption,
  SearchFieldAutocompleteProps,
} from './components/SearchFieldAutocomplete'

// ─── Animated primitives ─────────────────────────────────────────────────────
export { AnimatedText } from './components/AnimatedText'

// ─── Positioning utilities ────────────────────────────────────────────────────
export {
  computeAnchorPanelPosition,
  computePointerAnchorPanelPosition,
} from './primitives/anchorPanelPosition'
export type {
  AnchorPanelPlacement,
  AnchorPanelPosition,
  ComputeAnchorPanelPositionInput,
} from './primitives/anchorPanelPosition'

// ─── Display ─────────────────────────────────────────────────────────────────
export { Badge, badgeVariants } from './components/Badge'
export type { BadgeProps, BadgeDotColor } from './components/Badge'

export { Tag, tagVariants } from './components/Tag'
export type { TagProps, TagColor } from './components/Tag'

export { Avatar } from './components/Avatar'
export type { AvatarProps } from './components/Avatar'

export { IconBox } from './components/IconBox'
export type { IconBoxProps } from './components/IconBox'

export { TextBox } from './components/TextBox'
export type { TextBoxProps } from './components/TextBox'

export { DescriptionRow, descriptionRowVariants } from './components/DescriptionRow'
export type { DescriptionRowProps } from './components/DescriptionRow'
export { EditableTagField } from './components/EditableTagField'
export type { EditableTagFieldOption, EditableTagFieldProps } from './components/EditableTagField'

// ─── SaaS parity (registry-gaps 구현체) ───────────────────────────────────────
export { BulkSelectionBar } from './components/BulkSelectionBar'
export type { BulkSelectionBarProps } from './components/BulkSelectionBar'

export { MaskedSecretDisplay } from './components/MaskedSecretDisplay'
export type { MaskedSecretDisplayProps } from './components/MaskedSecretDisplay'

export { FilterChipGroup } from './components/FilterChipGroup'
export type { FilterChipGroupProps, FilterChipOption } from './components/FilterChipGroup'

export { DataExportStatus } from './components/DataExportStatus'
export type { DataExportStatusProps, DataExportPhase } from './components/DataExportStatus'

export { DiffInlinePanel } from './components/DiffInlinePanel'
export type {
  DiffInlinePanelProps,
  DiffLineViewModel,
  DiffLineKind,
} from './components/DiffInlinePanel'

export { SparklineChart } from './components/SparklineChart'
export type { SparklineChartProps, SparklineSegment, AxisTick } from './components/SparklineChart'

export { MatrixToggleGrid } from './components/MatrixToggleGrid'
export type {
  MatrixToggleGridProps,
  MatrixToggleRowDef,
  MatrixToggleCellDef,
  MatrixToggleValue,
} from './components/MatrixToggleGrid'

export { ApprovalStepChain } from './components/ApprovalStepChain'
export type { ApprovalStepChainProps, ApprovalStepViewModel } from './components/ApprovalStepChain'

export { CommentThreadPanel } from './components/CommentThreadPanel'
export type {
  CommentThreadPanelProps,
  ThreadMessageViewModel,
} from './components/CommentThreadPanel'

export { MemoThread } from './components/MemoThread'
export type { MemoThreadComment, MemoThreadProps } from './components/MemoThread'

export { ImportWizardFrame } from './components/ImportWizardFrame'
export type { ImportWizardFrameProps } from './components/ImportWizardFrame'

export { KeyboardShortcutsOverlay } from './components/KeyboardShortcutsOverlay'
export type {
  KeyboardShortcutsOverlayProps,
  ShortcutGroupModel,
  ShortcutItemModel,
} from './components/KeyboardShortcutsOverlay'

export { Collapsible } from './components/Collapsible'
export type { CollapsibleProps } from './components/Collapsible'

export { CommandPalette } from './components/CommandPalette'
export type { CommandPaletteProps, CommandPaletteRow } from './components/CommandPalette'

export { SavedViewRail } from './components/SavedViewRail'
export type { SavedViewRailProps, SavedViewModel } from './components/SavedViewRail'

export { PresetDateRangeField } from './components/PresetDateRangeField'
export type {
  PresetDateRangeFieldProps,
  DateRangePresetModel,
  DateRangeFieldValue,
} from './components/PresetDateRangeField'

export { ImageLightbox } from './components/ImageLightbox'
export type { ImageLightboxProps } from './components/ImageLightbox'

export { AdvancedFilterPanel, DEFAULT_OPERATOR_OPTIONS } from './components/AdvancedFilterPanel'
export type {
  AdvancedFilterPanelProps,
  FilterCondition,
  FilterGroup,
} from './components/AdvancedFilterPanel'

export { ResizableSplitPane } from './components/ResizableSplitPane'
export type { ResizableSplitPaneProps } from './components/ResizableSplitPane'

export { MapEmbedSlot, MapContainer } from './components/MapEmbedSlot'
export type { MapEmbedSlotProps, MapContainerProps } from './components/MapEmbedSlot'

export { VideoPlayer } from './components/VideoPlayer'
export type { VideoPlayerProps } from './components/VideoPlayer'

export { VideoRecorder } from './components/VideoRecorder'
export type { VideoRecorderProps } from './components/VideoRecorder'
export { useVideoRecorder } from './components/VideoRecorder'

export { CameraCapture } from './components/CameraCapture'
export type { CameraCaptureProps } from './components/CameraCapture'
export { useCameraCapture } from './components/CameraCapture'

export { SignaturePadField } from './components/SignaturePadField'
export type { SignaturePadFieldProps } from './components/SignaturePadField'

export { RichTextEditor } from './components/RichTextEditor'
export type { RichTextEditorProps } from './components/RichTextEditor'

// ─── Data: Table (L3 + L2) ───────────────────────────────────────────────────
// L3 — `TableChromeContext`, density, loading scrim, scroll region, empty slot
export { Table } from './components/Table'
export type { TableProps, TableDensity } from './components/Table'

export { PivotTable } from './components/PivotTable'
export type {
  PivotTableProps,
  PivotRow,
  PivotColumn,
  PivotCellKey,
  PivotTableDensity,
} from './components/PivotTable'

export type { TableChrome } from './components/Table'

// L2 — `<table>` 프레임, 시맨틱 영역, 행·셀, 셀 내 스택 텍스트
export {
  TableFrame,
  tableFrameVariants,
  TableCaption,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableStackedText,
} from './components/Table'
export type {
  TableFrameProps,
  TableCaptionProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableStackedTextProps,
} from './components/Table'

export { Pagination } from './components/Pagination'
export type { PaginationProps } from './components/Pagination'

export { Spinner, spinnerVariants } from './components/Spinner'
export type { SpinnerProps } from './components/Spinner'

export { Skeleton } from './components/Skeleton'
export type { SkeletonProps } from './components/Skeleton'

export { EmptyState } from './components/EmptyState'
export type { EmptyStateProps } from './components/EmptyState'
export { PageHeader } from './components/PageHeader'
export type { PageHeaderProps } from './components/PageHeader'

export { RichList } from './components/RichList'
export type {
  RichListChrome,
  RichListDensity,
  RichListItem,
  RichListProps,
  RichListSelectionMode,
  RichListStatusTag,
} from './components/RichList'

export { Tooltip } from './components/Tooltip'
export type { TooltipProps } from './components/Tooltip'

// ─── Navigation ──────────────────────────────────────────────────────────────
export {
  TabBar,
  tabBarVariants,
  TabList,
  tabListVariants,
  TabTrigger,
  tabTriggerVariants,
  WorkspaceTabRowShell,
  workspaceTabRowShellVariants,
} from './components/TabBar'
export type {
  TabBarProps,
  TabBarItem,
  TabListProps,
  TabTriggerProps,
  WorkspaceTabRowShellProps,
} from './components/TabBar'

export {
  SegmentedControl,
  segmentedControlVariants,
  segmentedControlItemVariants,
} from './components/SegmentedControl'
export type { SegmentedControlItem, SegmentedControlProps } from './components/SegmentedControl'

export { Link, linkVariants } from './components/Link'
export type { LinkProps } from './components/Link'

export { Menu } from './components/Menu'
export type {
  MenuProps,
  MenuItem,
  MenuSeparator,
  MenuEntry,
  MenuTriggerProps,
} from './components/Menu'

export { Modal } from './components/Modal'
export type { ModalProps } from './components/Modal'

export { BottomSheet } from './components/BottomSheet'
export type { BottomSheetProps } from './components/BottomSheet'
export { Drawer } from './components/Drawer'
export type { DrawerProps } from './components/Drawer'
export { Fab, FabMenu } from './components/Fab'
export type { FabMenuItem, FabMenuProps, FabProps } from './components/Fab'

export { SideSheet, SideSheetHost, useSideSheetHost } from './components/SideSheet'
export type { SideSheetProps, SideSheetSide } from './components/SideSheet'

export {
  ToastRegion,
  toastBarVariants,
  severityDotVariants,
  regionPositionVariants,
} from './components/Toast'
export type { ToastRegionProps, ToastRecord, ToastSeverity } from './components/Toast'
export { ToastProvider, useToast } from './components/Toast'
export type { ToastInput, ToastProviderProps } from './components/Toast'

export { SnackbarRegion } from './components/Snackbar'
export type { SnackbarRegionProps, SnackRecord } from './components/Snackbar'
export { SnackbarProvider, useSnackbar } from './components/Snackbar'
export type { SnackInput, SnackbarProviderProps } from './components/Snackbar'

export { Sidebar, sidebarRootVariants } from './components/Sidebar'
export type { SidebarProps, SidebarItem, SidebarNavigateOptions } from './components/Sidebar'

// ─── Timeline ────────────────────────────────────────────────────────────────
// L3 — wrapper with vertical spine
export { Timeline } from './components/Timeline'
export type { TimelineProps, TimelineMeta, TimelineDensity } from './components/Timeline'
export { useTimelineMeta, TimelineMetaContext } from './components/Timeline'

// L2 — composite atoms
export {
  TimelineItem,
  resolveTimelineDensity,
  markerSizeForDensity,
} from './components/TimelineItem'
export type { TimelineItemInlineProps, TimelineItemBoxedProps } from './components/TimelineItem'
// TimelineItemInline and TimelineItemBoxed are DS-internal — use TimelineItem.Inline / TimelineItem.Boxed

// L1 — marker primitives
export {
  TimelineMarker,
  timelineMarkerVariants,
  phaseDotVariants,
  dotFillVariants,
} from './components/TimelineMarker'
export type { TimelineMarkerProps, TimelinePhase } from './components/TimelineMarker'

// ─── Timetable ───────────────────────────────────────────────────────────────
// L3 — shell, keyboard burst, default composition
export { Timetable } from './components/Timetable'
export type { TimetableProps } from './components/Timetable'

// L2 compound 네임스페이스 (권장: Timetable L2를 직접 사용할 때)
export { TimetableParts } from './components/Timetable'

// L2 — 하위 호환 개별 exports (대부분의 경우 TimetableParts 또는 Timetable 사용)
export {
  TimetableShell,
  TimetableController,
  TimetableDateNav,
  TimetableViewToolbar,
  TimetableGrid,
  TimetableResourceColumn,
  TimetableTimeSlotCell,
} from './components/Timetable'
export type {
  TimetableShellProps,
  TimetableControllerProps,
  TimetableDateNavProps,
  TimetableViewToolbarProps,
  TimetableGridProps,
  TimetableResourceColumnProps,
  TimetableTimeSlotCellProps,
} from './components/Timetable'

// L1
export { TimetableAppointmentBlock } from './components/Timetable'
export type { TimetableAppointmentBlockProps } from './components/Timetable'

export { TimetableAppointmentPreview } from './components/Timetable'
export type { TimetableAppointmentPreviewProps } from './components/Timetable'

export type {
  TimetableAppointment,
  TimetableAppointmentColor,
  TimetableDateMeta,
  TimetableDensity,
  TimetableLabels,
  TimetableResource,
  TimetableSlotAppearance,
  TimetableSlotCellPayload,
  TimetableSlotSelection,
  TimetableSlotTag,
} from './components/Timetable'

export {
  addCalendarDays,
  appointmentsForSlot,
  buildSlotIndexes,
  dateKey,
  formatTimeLabel,
  formatTimetableDate,
  formatMinuteRange,
  formatAppointmentPreviewLine,
  parseDateKey,
  shouldShowAppointmentsForCursor,
  slotCellStorageKey,
  slotMinuteForIndex,
  stepCursorDate,
} from './components/Timetable'

// ─── Primitives ──────────────────────────────────────────────────────────────
export {
  anchorPopoverRootClassName,
  anchorPopoverPanelBaseClassName,
  anchorPopoverPanelFixedClassName,
  usePointerDownOutside,
  useDismissOnEscape,
} from './primitives/anchorPopover'

export { Box, BoxScrollHintOverlay, boxVariants, useBoxScrollRegionHint } from './primitives/box'
export type { BoxProps } from './primitives/box'

export {
  Panel,
  drawerPanelVariants,
  panelVariants,
  resolvePanelVariants,
  PANEL_ANCHOR_GAP_PX,
  PANEL_SURFACE_ANCHOR_GAP_PX,
} from './primitives/panel'
export type { PanelProps } from './primitives/panel'

export { OverlayScrim } from './primitives/overlayScrim'
export type { OverlayScrimProps } from './primitives/overlayScrim'

export { OverlayContainerProvider, useOverlayContainer } from './primitives/overlayContainer'

/** @deprecated BoxScrollHintOverlay 사용 */
export { PanelScrollHintOverlay, usePanelScrollRegionHint } from './primitives/box'

export {
  ConnectedBox,
  ConnectedBoxDivider,
  ConnectedBoxSegment,
  connectedBoxDividerVariants,
  connectedBoxSegmentVariants,
  connectedBoxVariants,
} from './primitives/connectedBox'
export type {
  ConnectedBoxDividerProps,
  ConnectedBoxProps,
  ConnectedBoxSegmentProps,
} from './primitives/connectedBox'

export { DropdownPopover } from './primitives/dropdownPopover'
export type { DropdownPopoverProps } from './primitives/dropdownPopover'

export { AnchorContextSurface } from './primitives/anchorContextSurface'
export type { AnchorContextSurfaceProps } from './primitives/anchorContextSurface'

// L1 — 기본 트리거 + 패널. 커스텀 트리거는 `DropdownPopover`.
export { Dropdown } from './primitives/dropdown'
export type { DropdownProps } from './primitives/dropdown'

// ─── Navigation ──────────────────────────────────────────────────────────────
export { ExternalLink } from './components/ExternalLink'
export type { ExternalLinkProps } from './components/ExternalLink'

export { PanelNavBar, panelNavBarVariants } from './components/PanelNavBar'
export type { PanelNavBarProps } from './components/PanelNavBar'

// ─── Map ─────────────────────────────────────────────────────────────────────
export { RouteMap } from './components/RouteMap'
export type { RouteMapProps, GeoPoint } from './components/RouteMap'

export {
  MapboxMap,
  MapProvider,
  useMapConfig,
  resolveStyleUrl,
  MapboxSelectionProvider,
  useMapboxSelection,
  MarkerSprite,
  FloatingBounce,
} from './components/MapboxMap'
export type {
  MapboxMapProps,
  MapProviderProps,
  MapConfig,
  MapboxSelectionProviderProps,
  MarkerSpriteProps,
  FloatingBounceProps,
  LngLat,
  MapTheme,
  MapCamera,
  MapMarker,
  MapArrow,
  MapArrowStop,
  MapRouteLoop,
  MapRouteLoopStop,
  MapRegionStyle,
  MapRegionState,
  MapRegionStyler,
  MapStopDropEvent,
  MapFeatureClickEvent,
  MapClusterOptions,
  MapOverlay,
  MapOverlayAnchor,
  MapPadding,
  MapView,
  MarkerVariant,
} from './components/MapboxMap'

// ─── Typography (신규) ───────────────────────────────────────────────────────
export { Text, textVariants } from './components/Text'
export type { TextProps } from './components/Text'

export { Heading } from './components/Heading'
export type { HeadingProps } from './components/Heading'

export { Code, codeVariants } from './components/Code'
export type { CodeProps } from './components/Code'

// ─── Block editor affordance (신규) ──────────────────────────────────────────
export { BlockHandle, blockHandleVariants } from './components/BlockHandle'
export type { BlockHandleProps } from './components/BlockHandle'

// ─── Utils ───────────────────────────────────────────────────────────────────
export { pressScale, stateLayer, motionTransition } from './utils/interactionUtils'

// ─── Motion tokens (JS layer) ─────────────────────────────────────────────────
export {
  spring,
  duration,
  ease,
  reducedMotion,
  overlayVariants,
  panelReveal,
  panelRevealContent,
  panelRevealItem,
  scaleReveal,
  axisExpandVariants,
} from './foundations/motionTokens'
export type {} from './foundations/motionTokens'

// ─── Expressive Motion Language — 패널형 표면 공용 등장 primitive ────────────────
export { PanelReveal, AxisExpand, ScaleReveal } from './primitives/reveal'
export type { PanelRevealProps, AxisExpandProps, ScaleRevealProps } from './primitives/reveal'

// ─── List reorder (노션식 실시간 스왑 엔진) ─────────────────────────────────────
export { beginListReorder, computeReorder, reorderArray } from './primitives/listReorder'
export type { ReorderResult, ListReorderItem } from './primitives/listReorder'

export { createTypoSlots, typoContainer, TYPO_SLOT_DEFAULTS } from './utils/createTypoSlots'
export type {
  TypoSlotName,
  TypoSlotDef,
  TypoSlotProps,
  TypoSlotComponent,
  WithTypoSlots,
} from './utils/createTypoSlots'

export { cn } from './utils/cn'
export { isMousePointer } from './utils/pointer'

export {
  createIconElement,
  iconClassName,
  BookUser,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Copy,
  Dices,
  Crosshair,
  Eye,
  EyeOff,
  FileText,
  Play,
  CirclePlay,
  FlaskConical,
  Handshake,
  Hash,
  Home,
  LayoutDashboard,
  Link2,
  List,
  Lock,
  Mail,
  Map,
  MapPin,
  MessageSquare,
  Monitor,
  Moon,
  MoreHorizontal,
  MousePointerClick,
  MoveRight,
  Package,
  PanelLeft,
  PanelRight,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  SquareCheck,
  Sun,
  Tags,
  Trash2,
  Trophy,
  Type,
  User,
  UserPlus,
  Users,
  X,
} from './icons'
export type { IconSize, LucideIcon, LucideProps } from './icons'

export { layoutGapScale } from './utils/layoutGapScale'
export type { LayoutGapKey } from './utils/layoutGapScale'
export { buildPaginationRange } from './utils/buildPaginationRange'
export { boxShapeVariants, getInitials } from './utils/boxShape'
export type { BoxShapeVariants } from './utils/boxShape'
export { buttonColorVariants } from './utils/buttonColors'

// ── Charts ──────────────────────────────────────────────────────────────────

// Shared shell + utilities — ChartFrame is DS-internal; consumed only by chart components
export {
  readToken,
  readSeriesColors,
  readSeriesColor,
  readSeriesColorSubtle,
  CHART_TOKENS,
  createLinearScale,
  createBandScale,
  createTimeScale,
  createOrdinalColorScale,
  createSqrtScale,
  createSequentialScale,
  useChartDimensions,
  useChartTooltip,
  formatTooltipValue,
  DEFAULT_MARGIN,
} from './utils/chart'
export type {
  ChartMargin,
  ChartDimensions,
  DataPoint,
  SeriesData,
  CategoryValue,
  StackedCategoryValue,
  HeatCell,
  CalendarEntry,
  HierarchyDatum,
  SankeyNode,
  SankeyLink,
  GraphNode,
  GraphEdge,
  TooltipState,
} from './utils/chart'

// Phase 1 — Comparison
export { BarChart } from './components/BarChart'
export type { BarChartProps, BarDataItem, BarChartVariant } from './components/BarChart'
export { LineChart } from './components/LineChart'
export type { LineChartProps } from './components/LineChart'
export { AreaChart } from './components/AreaChart'
export type { AreaChartProps, AreaDataPoint } from './components/AreaChart'
export { PieChart } from './components/PieChart'
export type { PieChartProps } from './components/PieChart'

// Phase 2 — Distribution
export { Histogram } from './components/Histogram'
export type { HistogramProps } from './components/Histogram'
export { BoxPlot } from './components/BoxPlot'
export type { BoxPlotProps, BoxPlotGroup, BoxStats } from './components/BoxPlot'
export { ScatterPlot } from './components/ScatterPlot'
export type { ScatterPlotProps, ScatterSeries, ScatterPoint } from './components/ScatterPlot'
export { BubbleChart } from './components/BubbleChart'
export type { BubbleChartProps, BubbleSeries, BubblePoint } from './components/BubbleChart'

// Phase 3 — Pattern / Multivariate
export { HeatmapChart } from './components/HeatmapChart'
export type { HeatmapChartProps } from './components/HeatmapChart'
export { CalendarHeatmap } from './components/CalendarHeatmap'
export type { CalendarHeatmapProps } from './components/CalendarHeatmap'

export {
  ContributionGraph,
  GRAPH_LEVELS,
  buildContributionGraphColorScale,
  contributionGraphPrimaryScales,
  graphCellSurfaceClass,
  graphCellVariants,
  graphDensityPresets,
  valueToLevel,
} from './components/ContributionGraph'
export type {
  ContributionGraphProps,
  ContributionGraphColorScale,
  ContributionGraphPrimary,
  GraphCell,
  GraphDensity,
  GraphLevel,
} from './components/ContributionGraph'
export { RadarChart } from './components/RadarChart'
export type { RadarChartProps, RadarSeries, RadarDataItem } from './components/RadarChart'

// Phase 4 — Flow / Hierarchy
export { FunnelChart } from './components/FunnelChart'
export type { FunnelChartProps } from './components/FunnelChart'
export { WaterfallChart } from './components/WaterfallChart'
export type { WaterfallChartProps, WaterfallItem } from './components/WaterfallChart'
export { TreemapChart } from './components/TreemapChart'
export type { TreemapChartProps } from './components/TreemapChart'

// Phase 5 — Advanced
export { GaugeChart } from './components/GaugeChart'
export type { GaugeChartProps, GaugeThreshold, GaugeStatus } from './components/GaugeChart'
export { SankeyChart } from './components/SankeyChart'
export type { SankeyChartProps } from './components/SankeyChart'
export { SunburstChart } from './components/SunburstChart'
export type { SunburstChartProps } from './components/SunburstChart'
export { ForceDirectedGraph } from './components/ForceDirectedGraph'
export type { ForceDirectedGraphProps } from './components/ForceDirectedGraph'
