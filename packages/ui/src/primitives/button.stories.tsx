import type { Meta, StoryObj } from '@storybook/react'
import { useId, useState } from 'react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: { children: 'Button' },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}
export const Sandbox: Story = { args: { variant: 'sandbox', children: 'Get Started' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Outline: Story = { args: { variant: 'outline' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } }
export const Loading: Story = { args: { loading: true, children: 'Save changes' } }

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">XLarge</Button>
    </div>
  ),
}

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="default">Default</Button>
        <Button variant="sandbox">Sandbox</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </div>
  ),
}

export const ActionContracts: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Toggle disabled/loading, then try pointer, Enter and Space activation. Native buttons retain their submit default; links keep their action name while unavailable. Emulate prefers-reduced-motion to check the spinner and press effect.',
      },
    },
  },
  render: function ActionContracts() {
    const resultId = useId()
    const [disabled, setDisabled] = useState(false)
    const [loading, setLoading] = useState(false)
    const [submits, setSubmits] = useState(0)
    const [opens, setOpens] = useState(0)
    return (
      <div className="flex max-w-lg flex-col gap-4">
        <div className="flex gap-4">
          <label><input type="checkbox" checked={disabled} onChange={event => setDisabled(event.target.checked)} /> Disabled</label>
          <label><input type="checkbox" checked={loading} onChange={event => setLoading(event.target.checked)} /> Loading</label>
        </div>
        <form className="flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); setSubmits(value => value + 1) }}>
          <Button disabled={disabled} loading={loading}>Save changes</Button>
          <Button asChild disabled={disabled} loading={loading}>
            <button disabled={false} aria-busy={false}>Submit slotted button</button>
          </Button>
          <Button asChild disabled={disabled} loading={loading}>
            <a href={`#${resultId}`} onClick={() => setOpens(value => value + 1)}>Open result</a>
          </Button>
        </form>
        <p id={resultId} role="status">Submissions: {submits}. Link activations: {opens}.</p>
      </div>
    )
  },
}
