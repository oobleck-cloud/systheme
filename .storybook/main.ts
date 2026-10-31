import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

import type { StorybookConfig } from '@storybook/react-vite'

const packageRoot = path.resolve(__dirname, '..')

const config: StorybookConfig = {
  // 이 Storybook 은 design-system 만이 아니라 **그 위에 올라탄 레이아웃 패키지**까지 인덱싱한다.
  // @oobleck/collection-views(TableView·GalleryView·CalendarView…)는 리포에서 가장 레이아웃 밀도가
  // 높은 코드인데 자체 Storybook 이 없어 시각회귀(Chromatic·Lost Pixel) 사각지대였다 — #366 이
  // 그 대가였다(Tailwind `@source` 누락으로 유틸리티 85개가 생성되지 않았는데 Chromatic 은 green).
  // 별도 Storybook 대신 여기로 합친다: Chromatic 프로젝트·베이스라인·CI 잡이 하나로 유지되고,
  // collections 뷰가 DS 컴포넌트의 *합성*이라 같은 베이스라인 안에 있어야 회귀가 한눈에 보인다.
  // Tailwind 스캔 범위는 `.storybook/preview.css` 의 `@source` 가 함께 넓힌다(둘은 세트).
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../../collection/packages/collection-views/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/experimental-addon-test',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    const env = loadEnv('development', packageRoot, '')
    const mapboxToken = env.VITE_MAPBOX_ACCESS_TOKEN ?? ''

    return {
      ...config,
      plugins: [tailwindcss(), ...(config.plugins ?? [])],
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': path.resolve(__dirname, '../src'),
        },
      },
      define: {
        ...config.define,
        'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(mapboxToken),
      },
    }
  },
}

export default config
