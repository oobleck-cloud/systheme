import { defineWorkspace } from 'vitest/config'

/**
 * Vitest workspace — 두 개의 프로젝트를 병렬 실행:
 *
 *  1. unit  — jsdom 환경, src/**\/*.{test,spec}.{ts,tsx}
 *             (hooks/utils 단위 + fast-check property tests)
 *
 *  2. storybook — @storybook/experimental-addon-test 가 Storybook 8.6+에서
 *                제공하는 Vitest browser-mode 기반 story 실행기.
 *                jest-playwright-preset / @storybook/test-runner 에 의존하지
 *                않으므로 pnpm 호환 이슈가 없다.
 */
export default defineWorkspace([
  // 1. 기존 jsdom 단위 테스트 — vitest.config.ts 그대로 재사용
  './vitest.config.ts',
  // 2. Storybook stories (browser mode) — addon이 자동으로 provider 주입
  {
    extends: './vitest.config.ts',
    plugins: [
      // @ts-expect-error — experimental addon exports a Vite plugin
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@storybook/experimental-addon-test/vitest-plugin').storybookTest({
        storybookScript: 'pnpm storybook --ci',
      }),
    ],
    test: {
      name: 'storybook',
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        headless: true,
      },
      include: ['src/**/*.stories.{ts,tsx}'],
      setupFiles: ['./.storybook/vitest.setup.ts'],
    },
  },
])
