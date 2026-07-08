import type { Meta, StoryObj } from '@storybook/react'
import { FilePreview } from './file-preview'

const TS_SOURCE = `interface SandboxConfig {
  model: string
  timeout: number
  env: Record<string, string>
}

// Create a new sandbox and stream its output.
export async function run(config: SandboxConfig) {
  const sandbox = await Sandbox.create(config)
  for await (const chunk of sandbox.stream()) {
    process.stdout.write(chunk)
  }
}`

const JSON_SOURCE = `{
  "name": "@tangle-network/sandbox-ui",
  "version": "0.37.1",
  "type": "module",
  "scripts": {
    "build": "tsup",
    "test": "vitest run"
  }
}`

const SHELL_SOURCE = `# ~/.bashrc — loaded for interactive shells
export NIX_BIN_PATH=/nix/profile/bin
export PATH="$NIX_BIN_PATH:$PATH"

alias gs="git status"
alias ll="ls -alh"`

const CSV_SOURCE = `name,role,active
Ada,engineer,true
Linus,maintainer,true
Grace,architect,false`

const MARKDOWN_SOURCE = `# Artifact

Markdown still renders as **prose**, not as a code block.

- Themed headings
- \`inline code\`
- [links](https://tangle.tools)

---

| Element | Expected |
| --- | --- |
| Body | readable foreground |
| Table | subtle borders |
| Code | tokenized accent |`

const meta: Meta<typeof FilePreview> = {
  title: 'Files/FilePreview',
  component: FilePreview,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div className="h-[560px] w-[760px] bg-card text-foreground">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof FilePreview>

export const Code: Story = {
  name: 'Code (TypeScript) — syntax highlighted',
  args: { filename: 'run.ts', content: TS_SOURCE },
}

export const Json: Story = {
  name: 'JSON',
  args: { filename: 'package.json', content: JSON_SOURCE },
}

export const ShellDotfile: Story = {
  name: 'Shell dotfile (.bashrc)',
  args: { filename: '.bashrc', content: SHELL_SOURCE },
}

export const Csv: Story = {
  name: 'CSV table',
  args: { filename: 'people.csv', content: CSV_SOURCE },
}

export const MarkdownProse: Story = {
  name: 'Markdown (rendered prose)',
  args: { filename: 'README.md', content: MARKDOWN_SOURCE },
}

export const MarkdownProseLight: Story = {
  name: 'Markdown (light theme)',
  parameters: { backgrounds: { default: 'light' } },
  decorators: [
    (Story) => (
      <div data-theme="tangle-light" className="h-[560px] w-[760px] bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
  args: { filename: 'README.md', content: MARKDOWN_SOURCE },
}
