import { fn } from '@storybook/test'

import { ImageLightbox } from './ImageLightbox'
import anatomy from './ImageLightbox.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ImageLightbox> = {
  title: 'Components/L2/ImageLightbox',
  component: ImageLightbox,
  tags: ['autodocs'],
  args: {
    open: true,
    activeIndex: 0,
    caption: 'Screenshot',
    onOpenChange: fn(),
    onActiveIndexChange: fn(),
    onDownloadRequest: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ImageLightbox>

export const Default: Story = {
  args: {
    children: <span className="text-sm text-fg-muted">Image slot</span>,
  },
}

export const GalleryMid: Story = {
  args: {
    ...Default.args,
    activeIndex: 2,
    caption: 'Slide 3 of 5',
  },
}

export const OverlayClosed: Story = {
  args: {
    ...Default.args,
    open: false,
  },
}

/** 백드롭은 닫히므로 스킵하고 이전·다음·다운로드·닫기만 검증 */
export const AnatomyControls: Story = {
  args: {
    ...Default.args,
    activeIndex: 1,
  },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    backdrop: { skip: true },
    surface: { skip: true },
    close: { onPress: 'onOpenChange' },
    prev: { onPress: 'onActiveIndexChange' },
    next: { onPress: 'onActiveIndexChange' },
    'image-slot': { skip: true },
    caption: { skip: true },
    download: { onPress: 'onDownloadRequest' },
  }),
}
