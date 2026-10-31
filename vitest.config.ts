/// <reference types="vitest" />
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // vitest.workspace.ts 가 있어도 이 config를 직접 지정할 때는
    // stories 테스트를 포함하지 않는다. stories는 `test:stories` 에서만.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'storybook-static',
      'dist',
      '.lostpixel',
      'src/**/*.stories.{ts,tsx}',
      'src/**/*.ct.{ts,tsx}',
    ],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // 컴포넌트 렌더링은 Storybook/Chromatic에서 커버하므로
      // Vitest는 pure utility/util 파일만 측정 대상으로 삼는다.
      include: ['src/utils/**/*.{ts,tsx}', 'src/primitives/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/storybook/**',
      ],
      thresholds: {
        // 유틸 함수 기준 — 컴포넌트 파일은 include에서 배제
        branches: 50,
        functions: 40,
        lines: 10,
        statements: 10,
      },
    },
  },
})
