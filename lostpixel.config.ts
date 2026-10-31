import type { CustomProjectConfig } from 'lost-pixel'

/**
 * Lost Pixel — Chromatic의 OSS 대안. CHROMATIC_PROJECT_TOKEN이 없거나
 * 외부 SaaS를 쓸 수 없을 때 사용. 결과는 .lostpixel/ 디렉토리에 생성된다.
 *
 * CI에서:
 *   pnpm storybook:build
 *   pnpm exec lost-pixel
 *
 * 로컬에서 baseline 생성:
 *   pnpm exec lost-pixel update
 */
export const config: CustomProjectConfig = {
  storybookShots: {
    storybookUrl: './storybook-static',
    breakpoints: [375, 1280],
    mask: [
      // 시각 회귀에 노이즈가 큰 영역 차단
      { selector: '[data-slot="spinner-root"]' },
      { selector: '.ds-timetable-shake-active' },
    ],
  },

  lostPixelProjectId: 'mvos-design-system',
  apiKey: process.env.LOST_PIXEL_API_KEY,

  imagePathBaseline: '.lostpixel/baseline',
  imagePathCurrent: '.lostpixel/current',
  imagePathDifference: '.lostpixel/difference',

  threshold: 0.01,
  shotConcurrency: 4,
  waitBeforeScreenshot: 200,
  failOnDifference: true,

  filterShot: ({ shotName }) => {
    return !/^components\/L[123]\/(Timetable|EmojiPicker)/.test(shotName)
  },
}
