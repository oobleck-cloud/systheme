# Timetable

스크린 기준 **타임테이블 UI** — `*.anatomy.json`에 정의된 구조를 `src/components/Timetable/*.tsx`로 구현했습니다.

## 레이어 (구현)

| Export                                                                                                          | 레이어                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Timetable`                                                                                                     | **L3** — 상태·슬롯 셀 맵·`TimetableShell` + `TimetableController` + `TimetableGrid` 합성 |
| `TimetableShell`                                                                                                | **L2** — `role="application"`, 동일 방향 ←/→ 연타 시 `onDeactiveRevealForced`            |
| `TimetableController`                                                                                           | **L2**                                                                                   |
| `TimetableDateNav`, `TimetableViewToolbar`, `TimetableGrid`, `TimetableResourceColumn`, `TimetableTimeSlotCell` | **L2**                                                                                   |
| `TimetableAppointmentBlock`                                                                                     | **L1**                                                                                   |
| `Switch`                                                                                                        | **L1** — `TimetableViewToolbar` 등 공용 토글                                             |

Storybook: `Components/L3/Timetable`.

## 문구 (`labels`)

`Timetable`에 `labels={{ includeDeactive: '…' }}` 를 넘기면 상단 툴바의 스위치 옆 문구를 제품에서 고정하거나 로캘라이즈할 수 있습니다. 기본 문구는 **「비활성 일정 포함」**(꺼짐=활성 일·일정만, 켜짐=비활성 일 포함)입니다.

## 슬롯 비활성·선택

- **`isSlotDisabled`**: `( { resourceId, slotMinute } ) => boolean` — `true`이면 해당 칸은 회색·`cursor-not-allowed`, 클릭·복사·툴팁 없음(레거시 TimeTable의 `disabled`/`blocked`에 대응하는 계약).
- **빈 슬롯 선택**: 클릭 시 `ring` + 배경으로 선택이 보이며, `data-resource-id` / `data-slot-minute`로 DOM 식별 가능. `selectedSlot` / `defaultSelectedSlot` / `onSelectedSlotChange`로 제어·비제어. 날짜가 바뀌면 비제어 시 선택만 초기화.
- 일정 블록을 활성화하면 빈 슬롯 선택은 자동으로 해제됩니다.

## 밀도·타이포

- `data-density`에 따라 `--ds-density-timetable-slot-h`·`--ds-density-timetable-time-col-w` 등이 바뀌며, 시간 레일은 **`text-density-timetable-rail`**(`--ds-density-timetable-rail-size`, 기본 12px / comfortable 13px / compact 10.5px)로 열 헤더보다 한 단 작게 둡니다.
- 일정 칩은 셀에 맞춘 `rounded-none`·살짝 낮은 굵기·`0.8125rem` 근처 타이포로 그리드와 붙어 보이게 맞춰 두었습니다.

## 조합 관계

| 구성요소                    | 역할                                                            |
| --------------------------- | --------------------------------------------------------------- |
| `TimetableShell`            | **L2** — `role="application"`·키보드 연타, 컨트롤러/그리드 영역 |
| `TimetableController`       | **L2** — 상단; `TimetableDateNav` / `TimetableViewToolbar` 배치 |
| `TimetableDateNav`          | **L2** — 이전·다음 일, 달력 disclosure                          |
| `TimetableViewToolbar`      | **L2** — 시간 뷰포트 스텝, 비활성 일정 포함 `Switch`            |
| `TimetableGrid`             | **L2** — CSS Grid: 시간 레일, 리소스 헤더, 슬롯 셀·일정 블록    |
| `TimetableResourceColumn`   | **L2** (선택) — 커스텀 열 합성 시 슬롯 스택                     |
| `TimetableTimeSlotCell`     | **L2** — 빈 슬롯(비활성·선택·호버 프리뷰·복사)                  |
| `TimetableAppointmentBlock` | **L1** — 일정 칩                                                |
| `Switch`                    | **L1** — 토글 (툴바 등)                                         |

```
Timetable (L3)
└── TimetableShell
    ├── controller-region → TimetableController
    │     ├── date-nav → TimetableDateNav
    │     └── view-toolbar → TimetableViewToolbar (Switch + labels)
    └── grid-region → TimetableGrid
          ├── time rail + TimetableTimeSlotCell (빈 슬롯)
          └── TimetableAppointmentBlock (span 일정)
```

## 레거시 스펙 메모 (anatomy 기준)

아래는 초기 anatomy에 맞춘 **슬롯 편집(입력·태그)** 설계 메모입니다. 현재 기본 그리드 구현은 **표시 전용 슬롯 + 일정 칩** 위주이며, 편집 UI가 필요하면 `TimetableResourceColumn` 합성으로 확장하면 됩니다.

- **`appearance`**: 슬롯마다 배경/테두리/강조 토큰을 다르게 줄 수 있음. anatomy에서는 `state-indicator`에 `appearance`를 바인딩해 시각 매핑만 담당한다고 적어 두었고, 실제 토큰 집합은 제품/DS에서 정의.
- **텍스트 입력**: `cell-text-input`은 **`value-input`**, 단일 행 전제(`@timetable-slot-inline-single-line-nowrap`). 개행이 아니라 한 줄 안에서 입력이 이어짐.
- **태그**: `tag-inline-strip`이 `tags`를 `iterates`로 돌며, 각 `tag-instance`는 **`slot: true`** — 기본 합성은 **`Tag`**(라벨 슬롯 + 필요 시 remove `press-action`)처럼 인라인 폭을 차지하는 칩. 텍스트 필드 **옆**(구현에서 `flex-direction: row`, `flex-wrap: nowrap`)에 붙이면 됨.
- **열 부모 이벤트**: `TimetableResourceColumn`은 `onTimeSlotTextChange` / `onTimeSlotTagsChange`로 슬롯 인덱스와 함께 버블하는 계약을 두면 됨(페이로드 shape는 구현 타입으로 고정).

## 스펙 메모 (연타 해제)

- **좌·우 어느 방향이든** 동일 방향 키 **연타(더블)** 시 `onDeactiveRevealForced` — 상위에서 `includeDeactiveDates`를 켜고 `shakeActive`를 잠깐 true로 처리하는 흐름을 가정합니다.
- `TimetableShell`의 `keyboard-deactive-unlock` part는 **가시 UI가 없을 수 있음**(키보드 정책만 담당); 구현 시 `role="application"` 등과 함께 루트에 핸들러를 붙여도 됩니다.
