import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { ExpandablePanel } from './expandable-panel'
import { MetricChart } from './metric-chart'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const meta: Meta = {
  title: 'Primitives/ExpandablePanel',
  parameters: { layout: 'padded', backgrounds: { default: 'dark' } },
}

export default meta
type Story = StoryObj

const t0 = Date.parse('2026-08-24T07:00:00.000Z')
const points = Array.from({ length: 24 }, (_, i) => ({ at: t0 + i * 3_600_000, value: 40 + Math.round(20 * Math.sin(i / 3)) + i }))

// Hover or focus the panel for the toggle; Escape closes the open popover first, then the panel.
export const ChartPanel: Story = {
  render: () => (
    <ExpandablePanel
      label="Throughput chart"
      className="h-72 w-[560px] rounded-xl border border-border bg-card p-4"
      actions={
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">Range</Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 text-sm">Last 24 hours</PopoverContent>
        </Popover>
      }
    >
      <MetricChart title="Throughput" unit="req/s" points={points} className="min-h-0 flex-1" />
    </ExpandablePanel>
  ),
}
