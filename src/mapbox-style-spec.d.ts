/**
 * Mapbox style-spec 검증기 선언.
 *
 * `mapbox-gl` 은 이 서브경로에 `index.d.ts` 를 함께 두지만 파일이 `.cjs` 라 TypeScript 가
 * 짝을 찾지 못한다. 레이어 정의를 지도 없이 검증하는 테스트에서만 쓰므로, 실제로 부르는
 * 함수 하나만 선언해 둔다.
 */
declare module 'mapbox-gl/dist/style-spec/index.cjs' {
  /** 스타일이 스펙을 어겼으면 오류 목록을, 멀쩡하면 빈 배열을 돌려준다 */
  export function validate(style: unknown, styleSpec?: unknown): Array<{ message: string }>
}
