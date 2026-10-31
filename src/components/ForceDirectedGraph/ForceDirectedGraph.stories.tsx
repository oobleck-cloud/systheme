import { fn } from '@storybook/test'

import { ForceDirectedGraph } from './ForceDirectedGraph'
import anatomy from './ForceDirectedGraph.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const socialNodes = [
  { id: 'alice', label: 'Alice', group: 'team-a', value: 30 },
  { id: 'bob', label: 'Bob', group: 'team-a', value: 20 },
  { id: 'carol', label: 'Carol', group: 'team-b', value: 25 },
  { id: 'dave', label: 'Dave', group: 'team-b', value: 15 },
  { id: 'eve', label: 'Eve', group: 'team-c', value: 35 },
  { id: 'frank', label: 'Frank', group: 'team-c', value: 18 },
  { id: 'grace', label: 'Grace', group: 'team-a', value: 22 },
  { id: 'henry', label: 'Henry', group: 'team-b', value: 28 },
]

const socialEdges = [
  { source: 'alice', target: 'bob', value: 5 },
  { source: 'alice', target: 'carol', value: 3 },
  { source: 'alice', target: 'eve', value: 8 },
  { source: 'bob', target: 'grace', value: 4 },
  { source: 'carol', target: 'dave', value: 6 },
  { source: 'carol', target: 'henry', value: 3 },
  { source: 'eve', target: 'frank', value: 7 },
  { source: 'dave', target: 'henry', value: 5 },
  { source: 'grace', target: 'alice', value: 2 },
  { source: 'frank', target: 'bob', value: 4 },
]

const meta: Meta<typeof ForceDirectedGraph> = {
  title: 'Components/Charts/ForceDirectedGraph',
  component: ForceDirectedGraph,
  tags: ['autodocs'],
  args: {
    nodes: socialNodes,
    edges: socialEdges,
    onNodeClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof ForceDirectedGraph>

export const Default: Story = {
  args: { title: '소셜 네트워크' },
}

export const LargeGraph: Story = {
  args: {
    title: '대규모 네트워크',
    nodes: Array.from({ length: 30 }, (_, i) => ({
      id: `n${i}`,
      label: `N${i}`,
      group: `g${i % 5}`,
      value: Math.floor(Math.random() * 20) + 5,
    })),
    edges: Array.from({ length: 50 }, (_, i) => ({
      source: `n${Math.floor(Math.random() * 30)}`,
      target: `n${Math.floor(Math.random() * 30)}`,
      value: Math.floor(Math.random() * 10),
    })),
    height: 520,
  },
}

export const Empty: Story = {
  args: { nodes: [], edges: [], title: '빈 데이터' },
}
