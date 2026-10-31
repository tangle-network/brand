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
 * The default and the only HIPAA state surfaces may ship before the
 * documented launch gate closes. Renders "HIPAA-Ready", outlined, on the
 * info triple.
 */
export const Ready: Story = { args: { status: 'ready' } }

/**
 * Reserved for after HIPAA's launch gate closes (BAAs executed +
 * infrastructure blockers resolved, per
 * compliance/policies/hipaa-security-program.md). Renders "HIPAA Compliant",
 * filled, on the success triple.
 */
export const Compliant: Story = { args: { status: 'compliant' } }

export const ReadyMedium: Story = { args: { status: 'ready', size: 'md' } }
export const CompliantMedium: Story = { args: { status: 'compliant', size: 'md' } }

/**
 * SOC 2 before an attestation: plain "SOC 2", outlined.
 */
export const Soc2Ready: Story = { args: { product: 'soc2', status: 'ready' } }

/**
 * SOC 2 Type II is an ATTAINED audit (final report on file at
 * compliance/evidence/2026-09-01-final-audit), so unlike HIPAA's "compliant"
 * this filled form is legitimate to ship today. Renders "SOC 2 Type II".
 */
export const Soc2TypeII: Story = { args: { product: 'soc2', status: 'compliant' } }

export const Soc2TypeIIMedium: Story = {
  args: { product: 'soc2', status: 'compliant', size: 'md' },
}

export const Linked: Story = {
  args: { status: 'ready', href: '/trust' },
}

export const AllStates: Story = {
  name: 'All States',
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <div className="text-muted-foreground text-xs font-mono">HIPAA</div>
      <div className="flex flex-wrap items-center gap-2">
        <ComplianceBadge status="ready" />
        <ComplianceBadge status="compliant" />
        <ComplianceBadge status="ready" size="md" />
        <ComplianceBadge status="compliant" size="md" />
      </div>
      <div className="text-muted-foreground text-xs font-mono mt-2">SOC 2</div>
      <div className="flex flex-wrap items-center gap-2">
        <ComplianceBadge product="soc2" status="ready" />
        <ComplianceBadge product="soc2" status="compliant" />
        <ComplianceBadge product="soc2" status="ready" size="md" />
        <ComplianceBadge product="soc2" status="compliant" size="md" />
      </div>
      <div className="text-muted-foreground text-xs font-mono mt-2">Linked</div>
      <div className="flex flex-wrap items-center gap-2">
        <ComplianceBadge status="ready" href="/trust" />
        <ComplianceBadge product="soc2" status="compliant" href="/trust" />
      </div>
    </div>
  ),
}
