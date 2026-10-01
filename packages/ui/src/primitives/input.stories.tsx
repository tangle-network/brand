import type { Meta, StoryObj } from '@storybook/react'
import { useId } from 'react'
import { Input, Textarea } from './input'
import { Label } from './label'

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  parameters: { layout: 'centered', backgrounds: { default: 'dark' } },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  render: () => <Input placeholder="Enter value..." className="w-72" />,
}

export const WithLabel: Story = {
  render: () => (
    <div className="w-72">
      <Input label="Sandbox name" placeholder="my-sandbox-01" />
    </div>
  ),
}

export const WithHint: Story = {
  render: () => (
    <div className="w-72">
      <Input
        label="Memory limit"
        placeholder="512"
        hint="Value in megabytes. Max 8192."
      />
    </div>
  ),
}

export const WithError: Story = {
  render: () => (
    <div className="w-72">
      <Input
        label="Image tag"
        defaultValue="latest!!"
        error="Image tag contains invalid characters."
      />
    </div>
  ),
}

export const SandboxVariant: Story = {
  render: () => (
    <div className="w-72">
      <Input variant="sandbox" label="API key" placeholder="sk-..." />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <Input label="Region" defaultValue="us-east-1" disabled />
    </div>
  ),
}

export const TextareaDefault: Story = {
  name: 'Textarea / Default',
  render: () => (
    <div className="w-72">
      <Textarea placeholder="Describe the sandbox configuration..." />
    </div>
  ),
}

export const TextareaWithLabelAndHint: Story = {
  name: 'Textarea / With Label & Hint',
  render: () => (
    <div className="w-72">
      <Textarea
        label="Startup script"
        placeholder="#!/bin/bash&#10;npm install"
        hint="Runs once when the sandbox boots."
      />
    </div>
  ),
}

export const Overview: Story = {
  name: 'Overview',
  render: () => (
    <div className="flex flex-col gap-6 p-6 w-96">
      <div className="text-muted-foreground text-xs font-mono uppercase tracking-widest">Input variants</div>
      <Input label="Sandbox name" placeholder="my-sandbox-01" />
      <Input
        variant="sandbox"
        label="Secret key"
        placeholder="sk-live-..."
        hint="Keep this value private."
      />
      <Input
        label="CPU cores"
        defaultValue="99cores"
        error="Must be a number between 1 and 32."
      />
      <Input label="Region" defaultValue="us-east-1" disabled />
      <div className="text-muted-foreground text-xs font-mono uppercase tracking-widest mt-2">Textarea</div>
      <Textarea
        label="Environment variables"
        placeholder="NODE_ENV=production&#10;PORT=3000"
        hint="One variable per line in KEY=VALUE format."
      />
    </div>
  ),
}

export const FieldRelationships: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Repeated labels must focus their own fields. Inspect accessible descriptions: caller help, hints, and errors coexist. The final field uses an explicit ID and the standalone shared Label.',
      },
    },
  },
  render: function FieldRelationships() {
    const id = useId()
    const descriptionId = `${id}-instructions`
    return (
      <div className="flex w-96 flex-col gap-4">
        <p id={descriptionId}>Shared instructions: choose a descriptive name.</p>
        <Input label="Name" hint="First name." aria-describedby={descriptionId} />
        <Input label="Name" hint="Second name." error="A name is required." aria-describedby={descriptionId} />
        <Textarea label="Name" hint="Explain the name." error="More detail is needed." aria-describedby={descriptionId} />
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-explicit`}>External label</Label>
          <Input id={`${id}-explicit`} hint="Explicit field ID is preserved." />
        </div>
      </div>
    )
  },
}
