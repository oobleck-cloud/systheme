/** 리소스(열) 정의 — anatomy `resources` */
export type TimetableResource = {
  id: string
  label: string
  /** 라벨 아래 보조 문구(이동수단·직군 등). 없으면 미표시 */
  sublabel?: string
}

/** 빈 슬롯 선택(일정 블록이 없는 칸) — `resourceId` + 슬롯 시작 시각(분) */
export type TimetableSlotSelection = {
  resourceId: string
  /** 당일 0시 기준, 슬롯 시작 분 */
  slotMinute: number
}

/** 날짜 메타 — anatomy `dates` (저장·활성 여부) */
export type TimetableDateMeta = {
  id: string
  /** `YYYY-MM-DD` 권장 */
  active: boolean
}

/** 일정 블록 색상 — `*-primary` 토큰에서 채도 높은 쪽을 사용 */
export type TimetableAppointmentColor =
  | 'primary' // blue-500
  | 'success' // green-500
  | 'warning' // orange-500
  | 'error' // red-500
  | 'info' // blue-500 (info 세트)

/** 일정 블록 — anatomy `appointments` */
export type TimetableAppointment = {
  id: string
  resourceId: string
  /** 당일 0시 기준 분 */
  startMinute: number
  endMinute: number
  label: string
  /** 블록 배경색. 기본 `primary` */
  color?: TimetableAppointmentColor
  /** 커스텀 배경색 (CSS color) — 지정 시 `color` 프리셋보다 우선. 구역별 해시 색상 등에 사용 */
  bgColor?: string
  /** 커스텀 글자색 (CSS color) — 파스텔 배경 위 대비용. 미지정 시 흰색 */
  fgColor?: string
  /** 클릭 시 복사할 값 — 미지정 시 `label` 복사 (예: 주문번호만 복사) */
  copyValue?: string
  /** 호버 미리보기에 노출할 부가 정보(상세 주소 등). 없으면 미표시 */
  detail?: string
}

export type TimetableSlotTag = {
  id: string
  label: string
}

/** 셀 표면 — 문자열은 프리셋 키, 객체는 인라인 CSS 변수 등 */
export type TimetableSlotAppearance = string | Record<string, string>

export type TimetableSlotCellPayload = {
  text?: string
  tags?: TimetableSlotTag[]
  appearance?: TimetableSlotAppearance
}

/**
 * `Table` 의 `density` 와 동일한 세 단계.
 * `Timetable` 루트에 `data-density`가 설정되며 `--ds-density-timetable-*`·`text-density-*` 등이 상속됩니다.
 */
export type TimetableDensity = 'comfortable' | 'default' | 'compact'

export type TimetableLabels = {
  /** `@label-time-prev` */
  timePrev?: string
  /** `@label-time-next` */
  timeNext?: string
  /**
   * `@label-include-deactive` — 스위치 옆 문구. **켜짐(기본)=활성 일정만**, 꺼짐=비활성 일·일정 포함.
   * 미지정 시 기본 문구는 디자인 시스템 문자열이며, 앱에서 이 필드로 덮어쓸 수 있음.
   */
  includeDeactive?: string
}
