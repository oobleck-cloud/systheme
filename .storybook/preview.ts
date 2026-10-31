import { withContextScope } from '../src/storybook/withContextScope'
import { withTheme } from '../src/storybook/withTheme'

import type { Preview } from '@storybook/react'

// Storybook 전용 진입점 — 배포 스타일(index.css) + Storybook 이 인덱싱하는
// 다른 패키지 소스의 Tailwind `@source` 선언. 상세는 preview.css 주석 참조.
import './preview.css'

const preview: Preview = {
  decorators: [withTheme, withContextScope],
  globalTypes: {
    theme: {
      description: 'Color scheme for component preview',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    surface: {
      description: '표면 스코프 — 모바일 현장 셸은 tinted',
      toolbar: {
        title: 'Surface',
        icon: 'photo',
        items: [
          { value: 'default', title: 'Surface: default' },
          { value: 'tinted', title: 'Surface: tinted (모바일)' },
        ],
        dynamicTitle: true,
      },
    },
    shape: {
      description: '조형 스코프 — 모바일 현장 셸은 expressive',
      toolbar: {
        title: 'Shape',
        icon: 'component',
        items: [
          { value: 'default', title: 'Shape: default' },
          { value: 'expressive', title: 'Shape: expressive (모바일)' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: '밀도 스코프 — 모바일 현장 셸은 comfortable',
      toolbar: {
        title: 'Density',
        icon: 'ruler',
        items: [
          { value: 'compact', title: 'Density: compact' },
          { value: 'default', title: 'Density: default' },
          { value: 'comfortable', title: 'Density: comfortable (모바일)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    surface: 'default',
    shape: 'default',
    density: 'default',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Foundations',
          'Primitives',
          'Display',
          'Components',
          ['Layout', ['Charts', ['Overview', '*']], 'L1', 'L2', 'L3', 'L4'],
        ],
        method: 'alphabetical',
      },
    },
  },
}

export default preview
