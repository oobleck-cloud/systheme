'use client'

import { forwardRef, useCallback, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select, type SelectOption } from '@/components/Select/Select'
import { Switch } from '@/components/Switch/Switch'
import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

// ─── Public types ─────────────────────────────────────────────────────────────

export type FilterCondition = {
  field: string
  operator: string
  value: string
}

export type FilterGroup = {
  conditions: FilterCondition[]
  logic: 'AND' | 'OR'
}

// ─── Internal ─────────────────────────────────────────────────────────────────

type InternalCondition = FilterCondition & { _id: string }

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

function makeCondition(): InternalCondition {
  return { _id: genId(), field: '', operator: '', value: '' }
}

function stringsToOptions(arr: string[]): SelectOption[] {
  return arr.map((s) => ({ value: s, label: s }))
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_OPERATOR_OPTIONS: SelectOption[] = [
  { value: 'eq', label: '같음' },
  { value: 'ne', label: '같지 않음' },
  { value: 'contains', label: '포함' },
  { value: 'not_contains', label: '포함하지 않음' },
  { value: 'gt', label: '초과' },
  { value: 'lt', label: '미만' },
  { value: 'gte', label: '이상' },
  { value: 'lte', label: '이하' },
  { value: 'is_empty', label: '비어있음' },
  { value: 'is_not_empty', label: '비어있지 않음' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

export type AdvancedFilterPanelProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onSubmit'
> & {
  /**
   * Layer 2 — 필드 이름 목록 (문자열). 제공 시 필드 셀을 Select로 렌더링.
   * `fieldOptions`가 함께 제공되면 `fieldOptions`가 우선합니다.
   */
  fields?: string[]
  /**
   * Layer 2 — 연산자 이름 목록 (문자열).
   * `operatorOptions`가 함께 제공되면 `operatorOptions`가 우선합니다.
   */
  operators?: string[]
  /** Layer 2 — 고급: label/value가 다른 경우 SelectOption 배열로 직접 전달. */
  fieldOptions?: SelectOption[]
  /** Layer 2 — 고급: 기본 한국어 연산자 목록 대신 사용할 SelectOption 배열. */
  operatorOptions?: SelectOption[]
  /** 오류 메시지 표시. */
  errorMessage?: string
  /** Layer 3 — "적용" 클릭 시 현재 필터 그룹 전체를 인자로 전달. */
  onSubmit?: (group: FilterGroup) => void
  /** Layer 3 — "초기화" 클릭 시 호출. 내부 state도 초기화됩니다. */
  onReset?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdvancedFilterPanel = forwardRef<HTMLDivElement, AdvancedFilterPanelProps>(
  (
    {
      className,
      fields,
      operators,
      fieldOptions,
      operatorOptions,
      errorMessage,
      onSubmit,
      onReset,
      ...props
    },
    ref,
  ) => {
    const [conditions, setConditions] = useState<InternalCondition[]>([makeCondition()])
    const [logic, setLogic] = useState<'AND' | 'OR'>('AND')

    const resolvedFieldOptions = fieldOptions ?? (fields ? stringsToOptions(fields) : undefined)
    const resolvedOperatorOptions =
      operatorOptions ?? (operators ? stringsToOptions(operators) : DEFAULT_OPERATOR_OPTIONS)

    const addCondition = useCallback(() => {
      setConditions((prev) => [...prev, makeCondition()])
    }, [])

    const removeCondition = useCallback((id: string) => {
      setConditions((prev) => (prev.length > 1 ? prev.filter((c) => c._id !== id) : prev))
    }, [])

    const updateCondition = useCallback((id: string, key: keyof FilterCondition, val: string) => {
      setConditions((prev) => prev.map((c) => (c._id === id ? { ...c, [key]: val } : c)))
    }, [])

    const handleSubmit = useCallback(() => {
      onSubmit?.({ conditions: conditions.map(({ _id, ...c }) => c), logic })
    }, [conditions, logic, onSubmit])

    const handleReset = useCallback(() => {
      setConditions([makeCondition()])
      setLogic('AND')
      onReset?.()
    }, [onReset])

    return (
      <Surface
        ref={ref}
        kind="section"
        density="default"
        data-slot="advanced-filter-panel-root"
        className={cn(
          '[&_[data-slot=surface-body]]:flex [&_[data-slot=surface-body]]:flex-col [&_[data-slot=surface-body]]:gap-3',
          className,
        )}
        {...props}
      >
        {/* Logic toggle */}
        <div
          data-slot="advanced-filter-panel-logic-toolbar"
          className="flex flex-wrap items-center gap-3"
        >
          <span data-slot="advanced-filter-panel-logic-toggle">
            <Switch
              checked={logic === 'AND'}
              aria-label="AND/OR 전환"
              onCheckedChange={(v) => setLogic(v ? 'AND' : 'OR')}
            />
          </span>
          <span data-slot="advanced-filter-panel-logic-hint" className="text-sm text-fg-muted">
            {logic === 'AND' ? '모든 조건 일치 (AND)' : '하나 이상 일치 (OR)'}
          </span>
        </div>

        {/* Condition rows */}
        <div data-slot="advanced-filter-panel-conditions" className="flex flex-col gap-2">
          {conditions.map((c) => (
            <div
              key={c._id}
              data-slot="advanced-filter-panel-condition-row"
              className="flex flex-wrap items-end gap-2"
            >
              <div data-slot="advanced-filter-panel-field" className="min-w-0 flex-1">
                {resolvedFieldOptions ? (
                  <Select
                    aria-label="필드"
                    options={resolvedFieldOptions}
                    value={c.field}
                    placeholder="필드 선택"
                    onChange={(v) => updateCondition(c._id, 'field', v)}
                  />
                ) : (
                  <Input
                    aria-label="필드"
                    value={c.field}
                    placeholder="필드"
                    onValueChange={(v) => updateCondition(c._id, 'field', v)}
                  />
                )}
              </div>
              <div data-slot="advanced-filter-panel-operator" className="min-w-0 flex-1">
                <Select
                  aria-label="조건식"
                  options={resolvedOperatorOptions}
                  value={c.operator}
                  placeholder="조건 선택"
                  onChange={(v) => updateCondition(c._id, 'operator', v)}
                />
              </div>
              <div data-slot="advanced-filter-panel-value" className="min-w-0 flex-1">
                <Input
                  aria-label="값"
                  value={c.value}
                  placeholder="값"
                  onValueChange={(v) => updateCondition(c._id, 'value', v)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-slot="advanced-filter-panel-remove-condition"
                disabled={conditions.length <= 1}
                onClick={() => removeCondition(c._id)}
              >
                삭제
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="advanced-filter-panel-add-condition"
          onClick={addCondition}
        >
          조건 추가
        </Button>

        <div
          data-slot="advanced-filter-panel-footer"
          className="flex flex-wrap items-center gap-2 border-t border-border pt-2"
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-slot="advanced-filter-panel-reset"
            onClick={handleReset}
          >
            초기화
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-slot="advanced-filter-panel-submit"
            onClick={handleSubmit}
          >
            적용
          </Button>
        </div>

        <p
          data-slot="advanced-filter-panel-error"
          className={cn('min-h-4 text-sm', errorMessage ? 'text-error-text' : 'text-fg-muted')}
        >
          {errorMessage ?? '\u00A0'}
        </p>
      </Surface>
    )
  },
)

AdvancedFilterPanel.displayName = 'AdvancedFilterPanel'

export { AdvancedFilterPanel, DEFAULT_OPERATOR_OPTIONS }
