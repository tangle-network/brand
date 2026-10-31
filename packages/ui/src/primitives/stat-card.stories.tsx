import type { Meta, StoryObj } from '@storybook/react'
import { Terminal } from 'lucide-react'
import { StatCard } from './stat-card'

const meta: Meta<typeof StatCard> = {
  title: 'Primitives/StatCard',
  component: StatCard,
  parameters: { layout: 'centered', backgrounds: { default: 'dark' } },
}

export default meta
type Story = StoryObj<typeof StatCard>

export const Default: Story = {
  args: {
    title: 'Active sessions',
    value: 24,
    subtitle: 'across 3 regions',
    icon: <Terminal className="h-5 w-5" />,
  },
}

export const SandboxVariant: Story = {
  name: 'Sandbox variant',
  args: {
    variant: 'sandbox',
    title: 'Active sessions',
    value: 24,
    subtitle: 'across 3 regions',
    icon: <Terminal className="h-5 w-5" />,
    trend: { value: 12, label: 'vs last hour' },
  },
}

export const CpuUsage: Story = {
  name: 'CPU usage',
  args: {
    title: 'Avg CPU usage',
    value: '68%',
    subtitle: 'p95: 94%',
    trend: { value: -4, label: 'vs yesterday' },
  },
}

export const MemoryUsage: Story = {
  name: 'Memory usage',
  args: {
    title: 'Memory allocated',
    value: '12.4 GB',
    subtitle: 'of 32 GB pool',
    trend: { value: 8, label: 'vs last hour' },
  },
}

export const MonthlyCost: Story = {
  name: 'Monthly cost',
  args: {
    title: 'Estimated cost',
    value: '$142.80',
    subtitle: 'current billing cycle',
    trend: { value: 0, label: 'vs last month' },
  },
}

export const TrendPositive: Story = {
  name: 'Trend up',
  args: {
    title: 'Sessions today',
    value: 1284,
    trend: { value: 23, label: 'vs yesterday' },
  },
}

export const TrendNegative: Story = {
  name: 'Trend down',
  args: {
    title: 'Error rate',
    value: '1.2%',
    trend: { value: -18, label: 'vs last week' },
  },
}

export const InfraGrid: Story = {
  name: 'Infrastructure grid',
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[640px]">
      <StatCard
        title="Active sessions"
        value={24}
        subtitle="across 3 regions"
        trend={{ value: 12, label: 'vs last hour' }}
      />
      <StatCard
        title="CPU usage"
        value="68%"
        subtitle="p95: 94%"
        trend={{ value: -4, label: 'vs yesterday' }}
      />
      <StatCard
        title="Memory allocated"
        value="12.4 GB"
        subtitle="of 32 GB pool"
        trend={{ value: 8, label: 'vs last hour' }}
      />
      <StatCard
        variant="sandbox"
        title="Estimated cost"
        value="$142.80"
        subtitle="current billing cycle"
        trend={{ value: 3, label: 'vs last month' }}
      />
      <StatCard
        title="Unique users"
        value={312}
        subtitle="last 30 days"
        trend={{ value: 19, label: 'vs last month' }}
      />
      <StatCard
        title="Avg startup time"
        value="840ms"
        subtitle="p99: 1.4s"
        trend={{ value: -11, label: 'vs last week' }}
      />
    </div>
  ),
}
