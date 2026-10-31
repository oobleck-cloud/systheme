/**
 * CSS 커스텀 프로퍼티(`--ds-*`) 인라인 style 지원.
 *
 * React.CSSProperties 는 csstype 기반으로 임의 CSS 변수를 허용하지 않으므로,
 * DS 내에서 `style={{ '--ds-foo': value }}` 패턴을 사용할 때 TypeScript 오류가 발생한다.
 * 이 선언으로 `--ds-` 프리픽스 CSS 변수에 대해 타입 오류 없이 인라인 style 지원을 활성화한다.
 */
import 'react'

declare module 'react' {
  interface CSSProperties {
    [key: `--ds-${string}`]: string | number | undefined
  }
}
