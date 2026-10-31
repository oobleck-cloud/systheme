import { useState } from 'react'

import { Slider } from './Slider'

/**
 * Playwright CT fixture: 현재 값을 data-value 속성으로 노출해 검증한다.
 */
export function SliderFixture({ initialValue = 50 }: { initialValue?: number }) {
  const [value, setValue] = useState(initialValue)
  return (
    <div data-testid="wrapper" data-value={value} className="w-64 p-4">
      <Slider value={value} onChange={setValue} min={0} max={100} label="볼륨" showValue />
    </div>
  )
}
