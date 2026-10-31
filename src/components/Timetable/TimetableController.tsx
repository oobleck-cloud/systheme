'use client'

import { cn } from '@/utils/cn'

type TimetableControllerProps = React.HTMLAttributes<HTMLDivElement> & {
  dateNavSlot: React.ReactNode
  viewToolbarSlot: React.ReactNode
}

function TimetableController({
  dateNavSlot,
  viewToolbarSlot,
  className,
  ...props
}: TimetableControllerProps) {
  return (
    <div
      data-slot="timetable-controller"
      className={cn(
        // 격자에 붙는 머리 한 줄. 왼쪽은 "언제를 보는가"(날짜), 오른쪽은 "어떻게 보는가"(구간·필터).
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2',
        'border-b border-border-subtle bg-surface py-1.5 pr-2.5 pl-1',
        className,
      )}
      {...props}
    >
      <div data-slot="date-nav" className="flex min-w-0 items-center">
        {dateNavSlot}
      </div>
      <div data-slot="view-toolbar" className="flex items-center">
        {viewToolbarSlot}
      </div>
    </div>
  )
}

export { TimetableController }
export type { TimetableControllerProps }
