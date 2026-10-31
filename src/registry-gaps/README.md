# Registry gaps (문서)

B2B SaaS에서 흔한 **부품** 중 `registry-gaps`로 정리했던 항목은 모두 `src/components/<PascalCase>/`로 이전되어 **React 구현체·anatomy·스토리·`data-slot` 정합**까지 갖춘 상태다. 이 디렉터리에는 **가이드 문서**만 남긴다.

- 부품별 **중복·조합·L티어·디자인 키워드**는 [`REGISTRY_SPEC.md`](./REGISTRY_SPEC.md)를 본문으로 한다.
- `intent-dictionary.json`에 없는 intent가 필요하면 `intent-curator`로 사전을 확장한 뒤 anatomy를 조정한다.

## 기존 DS와의 조합·유사도 (중복 방지 가이드)

| registry-gaps id             | 먼저 검토할 기존 DS·패턴                                                                   | 새 anatomy를 두는 이유                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `advanced-filter-panel`      | `SearchField`, `Accordion`, `Menu` 조합만으로는 **AND/OR·필드/연산자/값 행** 계약이 흩어짐 | L3 질의 구조를 한 트리로 고정                                         |
| `filter-chip-group`          | `Tag` + `Switch` 다수 조합 가능                                                            | **요약 칩** 다중 토글만 필요할 때 최소 단위                           |
| `saved-view-rail`            | `command-palette`와 겹치지 않음 — 팔레트는 **일시 실행**, 여기는 **이름 있는 저장 뷰**     | 지속형 저장 뷰 CRUD 시그니처                                          |
| `bulk-selection-bar`         | `Button`, `ButtonGroup`, `TextBox`로 조립 가능                                             | 선택 수 + **액션 슬롯**만 표준화할 때 얇은 셸                         |
| `preset-date-range-field`    | `DatePicker`/`Calendar` 두 개를 페이지에서 직접 배치 가능                                  | **프리셋 + 커스텀 패널** 오케스트레이션을 부품으로 고정               |
| `matrix-toggle-grid`         | `Table` + `Checkbox` 반복으로 구현 가능                                                    | **행·열 토글 격자** 의미를 한 번에 쓰고 싶을 때 (권한/컬럼 가시성 등) |
| `keyboard-shortcuts-overlay` | `Modal` + `DescriptionRow` 반복                                                            | 단축키 **그룹·코드·설명** 2단 반복 구조                               |
| `import-wizard-frame`        | `Steps` + `Modal` + `FileInput` 조합                                                       | **스텝 네비 + 파일 픽 + 완료**를 위저드 프레임으로 통일               |
| `comment-thread-panel`       | `Timeline` 패밀리 확장으로 대체 가능한지 먼저 검토                                         | 스레드형 **답글·더보기**가 타임라인과 UX가 다를 때                    |
| `data-export-status`         | `Progress` + `Alert` + `Button`                                                            | **배치보내기** 단계·다운로드 링크 계약                                |

## 부품 id → 구현 컴포넌트

| id                           | 한 줄 설명                                          | 구현 컴포넌트              |
| ---------------------------- | --------------------------------------------------- | -------------------------- |
| `advanced-filter-panel`      | AND/OR·조건 그룹·필드/연산자/값 행·미리보기 수·적용 | `AdvancedFilterPanel`      |
| `saved-view-rail`            | 저장 뷰 목록 선택·이름 편집 오버레이·저장/삭제/복제 | `SavedViewRail`            |
| `bulk-selection-bar`         | 선택 개수·액션 슬롯·일괄·해제                       | `BulkSelectionBar`         |
| `preset-date-range-field`    | 프리셋 선택·커스텀 범위 슬롯·시작/끝 입력           | `PresetDateRangeField`     |
| `keyboard-shortcuts-overlay` | 단축키 그룹·코드·설명 표                            | `KeyboardShortcutsOverlay` |
| `import-wizard-frame`        | 위저드 스텝·본문 슬롯·파일·완료/취소                | `ImportWizardFrame`        |
| `matrix-toggle-grid`         | 행 라벨 × 셀 `toggle` 격자 (권한/컬럼 등)           | `MatrixToggleGrid`         |
| `video-recorder`             | 권한 오버레이·프리뷰 슬롯·녹화/중지/폐기            | `VideoRecorder`            |
| `video-player`               | 뷰포트 슬롯·스크럽·재생 토글·자막·전체화면          | `VideoPlayer`              |
| `camera-capture`             | 프리뷰 슬롯·셔터·카메라 전환·버스트 카운트          | `CameraCapture`            |
| `image-lightbox`             | 백드롭·이전/다음·캡션·다운로드                      | `ImageLightbox`            |
| `map-embed-slot`             | 네이티브 맵 슬롯·로딩·재시도·저작권 표기            | `MapEmbedSlot`             |
| `rich-text-editor`           | 툴바 액션·본문 입력·링크 오버레이·멘션 검색         | `RichTextEditor`           |
| `command-palette`            | 검색·결과 `select-option`·실행                      | `CommandPalette`           |
| `resizable-split-pane`       | 양측 슬롯·비율 입력·드래그 상태                     | `ResizableSplitPane`       |
| `filter-chip-group`          | 옵션 반복·칩 토글                                   | `FilterChipGroup`          |
| `sparkline-chart`            | `chart-series` + `plot-axis` 최소 조합              | `SparklineChart`           |
| `data-export-status`         | 보내기 단계·진행·다운로드·해제                      | `DataExportStatus`         |
| `diff-inline-panel`          | 좌우 텍스트 + 변경 종류                             | `DiffInlinePanel`          |
| `approval-step-chain`        | 단계별 역할·상태·승인/반려/위임                     | `ApprovalStepChain`        |
| `comment-thread-panel`       | 메시지 반복·답글·더보기                             | `CommentThreadPanel`       |
| `signature-pad-field`        | 캔버스 슬롯·서명 제출                               | `SignaturePadField`        |
| `masked-secret-display`      | 마스킹 값·표시 토글·복사                            | `MaskedSecretDisplay`      |
