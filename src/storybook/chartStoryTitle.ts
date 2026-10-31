/** Storybook sidebar prefix for the chart component family. */
export const CHARTS_STORY_PREFIX = 'Components/Charts' as const

export function chartStoryTitle(componentName: string): `${typeof CHARTS_STORY_PREFIX}/${string}` {
  return `${CHARTS_STORY_PREFIX}/${componentName}`
}
