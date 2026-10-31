import path from 'node:path'

import { defineConfig, devices } from '@playwright/experimental-ct-react'

/**
 * Playwright Component Testing — Storybook play 함수만으로는 부족한 경우를
 * 실 브라우저에서 격리 마운트해 검증한다.
 *
 *  - focus trap / focus restore (Modal, Drawer, Menu)
 *  - 실 viewport scroll / sticky 측정 (Table virtual list, sticky header)
 *  - clock 제어 (Toast auto-dismiss, debounced search)
 *  - pointer drag (Slider, column resize, Timetable selection rectangle)
 *  - 다중 브라우저 엔진 차이 (WebKit input, Firefox range)
 *
 * 실행:
 *   pnpm exec playwright install chromium --with-deps
 *   pnpm test:ct
 */
export default defineConfig({
  testDir: './src',
  testMatch: /.*\.ct\.(ts|tsx)$/,
  snapshotDir: './__ct-snapshots__',
  timeout: 10_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
    /**
     * CT 전용 포트.
     *
     * 3100 은 MVOS 앱이 쓰는 번호다. Playwright CT 는 그 포트에 이미 누가 듣고 있으면
     * **자기 서버를 띄우지 않고 그 서버에 붙는다**. 셀프호스티드 러너에 앱 서버나 이전
     * 실행의 Vite 가 남아 있으면, CT 는 저장소에 없는 옛 번들을 돌게 된다 — 스택
     * 트레이스 줄 번호가 어긋나고(`Slider.ct.tsx:15:31` vs 실제 `:11:5`), import
     * 레지스트리가 낡아 "Unregistered component" 로 죽고, 손대지도 않은 Drawer·Modal
     * 포커스 트랩이 깨졌다(2026-09-14 CI). 같은 커밋이 로컬에서는 23건 전부 통과한다.
     *
     * 아무도 안 쓰는 번호로 옮긴다.
     */
    ctPort: 43100,
    ctTemplateDir: 'playwright',
    ctViteConfig: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
      // Tailwind CSS는 playwright/index.ts 에서 주입됨
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // CI 비용 절감 차원에서 우선 chromium만. 필요 시 webkit/firefox 활성화.
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
})
