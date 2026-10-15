import type { Meta, StoryObj } from '@storybook/react'
import { ComplianceBadge } from './compliance-badge'

const meta: Meta<typeof ComplianceBadge> = {
  title: 'Primitives/ComplianceBadge',
  component: ComplianceBadge,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof ComplianceBadge>

/**
 * The default and the only state surfaces may ship before the documented
 * launch gate closes. Renders "HIPAA-Ready", outlined, on the info triple.
 */
export const Ready: Story = { args: { status: 'ready' } }

/**
 * Reserved for after the launch gate closes (BAAs executed + infrastructure
 * blockers resolved, per compliance/policies/hipaa-security-program.md).
 * Renders "HIPAA Compliant", filled, on the success triple.
 */
export const Compliant: Story = { args: { status: 'compliant' } }

export const ReadyMedium: Story = { args: { status: 'ready', size: 'md' } }
export const CompliantMedium: Story = { args: { status: 'compliant', size: 'md' } }

export const Linked: Story = {
  args: { status: 'ready', href: '/trust' },
}

export const AllStates: Story = {
  name: 'All States',
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <div className="text-muted-foreground text-xs font-mono uppercase tracking-widest">Small</div>
      <div className="flex flex-wrap items-center gap-2">
        <ComplianceBadge status="ready" />
        <ComplianceBadge status="compliant" />
      </div>
      <div className="text-muted-foreground text-xs font-mono uppercase tracking-widest mt-2">Medium</div>
      <div className="flex flex-wrap items-center gap-2">
        <ComplianceBadge status="ready" size="md" />
        <ComplianceBadge status="compliant" size="md" />
      </div>
      <div className="text-muted-foreground text-xs font-mono uppercase tracking-widest mt-2">Linked</div>
      <div className="flex flex-wrap items-center gap-2">
        <ComplianceBadge status="ready" href="/trust" />
        <ComplianceBadge status="compliant" href="/trust" />
      </div>
    </div>
  ),
}
