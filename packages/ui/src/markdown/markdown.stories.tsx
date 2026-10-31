import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useState } from 'react'
import { Markdown } from './markdown'
import { CodeBlock, CopyButton } from './code-block'
import { codePresentation } from '../lib/code-presentation'

// ─── Markdown ────────────────────────────────────────────────────────────────

const markdownMeta: Meta<typeof Markdown> = {
  title: 'Markdown/Markdown',
  component: Markdown,
  parameters: { layout: 'centered', backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div className="w-[680px] max-w-full rounded-xl bg-card p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
}

export default markdownMeta
type Story = StoryObj<typeof Markdown>

const CONTRAST_MARKDOWN = `# GTM Agent Repository Overview

Source: \`github.com/tangle-network/gtm-agent\` Live at: [gtm.tangle.tools](https://gtm.tangle.tools)

---

## What It Is

GTM Agent is a go-to-market workspace where founders get a sandboxed environment and an agent that works alongside them.

## Architecture

| Layer | Owns | Location |
|------|------|----------|
| Engine | Stream normalization, DB port, harness | \`@tangle-network/agent-app\` |
| Shell | Auth, billing, RBAC, vault | \`src/routes/**\` |
| Runtime | Customer motion | Live sandbox |

## Tech Stack

- **Frontend:** Remix + Tailwind v4
- **Database:** SQLite + Drizzle ORM
- **Sandbox:** \`@tangle-network/sandbox\`

> Prime directive: ship the shell, never hardcode customer motion.

\`inline code\` stays readable beside paragraphs.

\`\`\`ts
export function readable(theme: 'light' | 'dark') {
  return theme
}
\`\`\`
`

export const LightThemeRegression: Story = {
  name: 'Light theme regression',
  parameters: { backgrounds: { default: 'light' } },
  render: () => (
    <div data-theme="tangle-light" className="rounded-xl bg-background p-6 text-foreground">
      <Markdown>{CONTRAST_MARKDOWN}</Markdown>
    </div>
  ),
}

export const DarkThemeRegression: Story = {
  name: 'Dark theme regression',
  render: () => (
    <div className="rounded-xl bg-background p-6 text-foreground">
      <Markdown>{CONTRAST_MARKDOWN}</Markdown>
    </div>
  ),
}

export const Prose: Story = {
  name: 'Prose',
  args: {
    children: `# Getting Started

Welcome to **sandbox-ui**. This library provides a set of composable components
for building agent-powered interfaces.

## Installation

\`\`\`bash
pnpm add @tangle/sandbox-ui
\`\`\`

## Usage

Import the components you need:

\`\`\`tsx
import { AgentComposer, DropZone, UploadProgress } from '@tangle-network/sandbox-ui'
\`\`\`

> **Note:** Components assume a Tailwind CSS v4 setup with the design tokens
> provided by the sandbox theme.

## Features

- Composable chat input with drag-and-drop
- File upload progress indicators
- Full-window and sidebar drop zones
- Dashboard primitives for sandbox monitoring
`,
  },
}

export const InlineCode: Story = {
  name: 'Inline code',
  args: {
    children: `Use the \`onDrop\` prop to handle dropped files. The \`accept\` prop takes a comma-separated
list of extensions like \`.pdf,.csv,.xlsx\`. When \`disabled\` is \`true\`, all drag events are ignored.`,
  },
}

export const Table: Story = {
  name: 'GFM table',
  args: {
    children: `| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`onDrop\` | \`(files: File[]) => void\` | — | Drop handler |
| \`accept\` | \`string\` | \`undefined\` | Accepted extensions |
| \`disabled\` | \`boolean\` | \`false\` | Disable drop zone |
| \`title\` | \`string\` | \`"Drop files to upload"\` | Overlay title |
`,
  },
}

export const CodeFences: Story = {
  name: 'Code fences (multiple languages)',
  args: {
    children: `### TypeScript

\`\`\`typescript
interface DropZoneProps {
  onDrop: (files: File[]) => void
  accept?: string
  disabled?: boolean
  children: ReactNode
}
\`\`\`

### Shell

\`\`\`bash
pnpm build && pnpm storybook
\`\`\`

### JSON

\`\`\`json
{
  "name": "@tangle/sandbox-ui",
  "version": "0.4.0",
  "type": "module"
}
\`\`\`
`,
  },
}

export const ListsAndTaskItems: Story = {
  name: 'Lists & task items',
  args: {
    children: `## Checklist

- [x] Drop zone overlay
- [x] Sidebar drop zone
- [x] Upload progress indicators
- [ ] Resumable uploads
- [ ] Multi-part S3 upload

## Unordered list

- Item one
- Item two
  - Nested item
  - Another nested item
- Item three

## Ordered list

1. Install dependencies
2. Configure theme tokens
3. Wrap your app with providers
4. Import components
`,
  },
}

export const BlockquoteAndHR: Story = {
  name: 'Blockquote & HR',
  args: {
    children: `> This component is designed to be a drop-in replacement for any file upload flow.
> It handles edge cases like nested drag events, accept filtering, and disabled states.

---

Regular paragraph after a horizontal rule.
`,
  },
}

// ─── CodeBlock ───────────────────────────────────────────────────────────────

export const CodeBlockOnly: Story = {
  name: 'CodeBlock standalone',
  render: () => (
    <div className="w-[680px] p-6 rounded-xl bg-card space-y-4">
      <CodeBlock code={`import { DropZone } from '@tangle/sandbox-ui'\n\nfunction App() {\n  return (\n    <DropZone onDrop={files => upload(files)}>\n      <Dashboard />\n    </DropZone>\n  )\n}`} language="tsx">
        <CopyButton text="import { DropZone } from '@tangle/sandbox-ui'" />
      </CodeBlock>
      <CodeBlock code={`pnpm add @tangle/sandbox-ui`} language="bash">
        <CopyButton text="pnpm add @tangle/sandbox-ui" />
      </CodeBlock>
    </div>
  ),
}

export const CodeBlockLabelledCopy: Story = {
  name: 'CodeBlock — labelled copy action',
  render: () => (
    <div className="w-full max-w-[680px] p-6 rounded-xl bg-card">
      <CodeBlock code={`<script src="https://embed.tangle.tools/agent.js" data-agent="support"></script>`} language="html" label="HTML">
        <CopyButton text={`<script src="https://embed.tangle.tools/agent.js" data-agent="support"></script>`} label="Copy embed code" />
      </CodeBlock>
      {/* A server-rendered host (tangle-router) builds the same header from codePresentation alone. */}
      <div className={`${codePresentation.root} mt-4`}>
        <div className={codePresentation.header}>
          <span>bash</span>
          <button type="button" className={codePresentation.copy}>Copy</button>
        </div>
        <pre className="p-3"><code>export TANGLE_API_KEY="sk-tan-..."</code></pre>
      </div>
    </div>
  ),
}

export const CodeBlockNoLanguage: Story = {
  name: 'CodeBlock — no language',
  render: () => (
    <div className="w-[680px] p-6 rounded-xl bg-card">
      <CodeBlock code="DROP TABLE users;  -- don't run this" />
    </div>
  ),
}

export const CodeBlockLight: Story = {
  name: 'CodeBlock — light theme',
  parameters: { backgrounds: { default: 'light' } },
  render: () => (
    <div className="w-[680px] p-6 rounded-xl bg-white space-y-4">
      <CodeBlock light code={`interface SandboxConfig {\n  model: string\n  timeout: number\n  env: Record<string, string>\n}\n\n// Create a new sandbox\nconst sandbox = await Sandbox.create(config)`} language="typescript">
        <CopyButton text="interface SandboxConfig" />
      </CodeBlock>
      <CodeBlock light code={`pnpm add @tangle-network/sandbox-ui`} language="bash" />
    </div>
  ),
}


/** Host typography must not add a moving closing quote to streamed text. */
function StreamingBlockquoteFixture() {
  const text = '> **A researcher collects the evidence and a writer prepares the draft.**\n> You decide when the work leaves the workspace. Each person sees the source, the proposed action and the result before approving it.'
  const [length, setLength] = useState(0)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    const delay = setTimeout(() => {
      let shown = 0
      interval = setInterval(() => {
        shown = Math.min(shown + 4, text.length); setLength(shown)
        if (shown === text.length) clearInterval(interval)
      }, 30)
    }, 1500)
    return () => { clearTimeout(delay); clearInterval(interval) }
  }, [])
  return <div className="streaming-blockquote-fixture" data-stream-length={length} data-stream-complete={length === text.length}>
    <style>{`@layer base {
      .streaming-blockquote-fixture blockquote p::before { content: open-quote; }
      .streaming-blockquote-fixture blockquote p::after { content: close-quote; }
    }`}</style>
    <Markdown>{text.slice(0, length)}</Markdown>
  </div>
}

export const StreamingBlockquote: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <StreamingBlockquoteFixture />,
}
