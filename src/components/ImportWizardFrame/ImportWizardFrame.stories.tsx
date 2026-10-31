import { fn } from '@storybook/test'

import { ImportWizardFrame } from './ImportWizardFrame'
import anatomy from './ImportWizardFrame.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ImportWizardFrame> = {
  title: 'Components/L2/ImportWizardFrame',
  component: ImportWizardFrame,
  tags: ['autodocs'],
  args: {
    currentStep: 1,
    fileLabel: 'orders.csv',
    errorMessage: '',
    onStepBack: fn(),
    onStepNext: fn(),
    onCancel: fn(),
    onComplete: fn(),
    onPickFile: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ImportWizardFrame>

export const Default: Story = {
  args: {
    children: <p className="text-sm text-fg-muted">Drop zone or mapping UI goes here.</p>,
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    errorMessage: 'Row 12: invalid date format',
  },
}

export const LaterStep: Story = {
  args: {
    ...Default.args,
    currentStep: 3,
    fileLabel: 'orders-final.csv',
  },
}

export const AnatomyWizardControls: Story = {
  args: {
    children: <p className="text-sm text-fg-muted">Mapping step</p>,
  },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    'step-nav': { skip: true },
    'step-body': { skip: true },
    'file-summary': { skip: true },
    error: { skip: true },
    back: { onPress: 'onStepBack' },
    next: { onPress: 'onStepNext' },
    'pick-file': { onPress: 'onPickFile' },
    cancel: { onPress: 'onCancel' },
    complete: { onPress: 'onComplete' },
  }),
}
