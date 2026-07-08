import type { Meta, StoryObj } from '@storybook/react'
import { DocumentEditorPane } from './document-editor-pane'

const MARKDOWN_SOURCE = `# GTM Agent Repository Overview

Source: \`github.com/tangle-network/gtm-agent\`

---

## What It Is

GTM Agent is an AI-powered go-to-market workspace where founders get a sandboxed environment.

## Architecture

| Layer | Owns | Location |
| --- | --- | --- |
| Engine | Stream normalization | \`@tangle-network/agent-app\` |
| Shell | Auth, billing, RBAC, vault | \`src/routes/**\` |

## Tech Stack

- Frontend: Remix + Tailwind v4
- Database: SQLite + Drizzle ORM
- Sandbox: \`@tangle-network/sandbox\`

[Launch](https://gtm.tangle.tools)
`

const meta: Meta<typeof DocumentEditorPane> = {
  title: 'Editor/DocumentEditorPane',
  component: DocumentEditorPane,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'dark' } },
  decorators: [
    (Story) => (
      <div className="h-[620px] w-[900px] bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof DocumentEditorPane>

export const PreviewDark: Story = {
  name: 'Preview (dark theme)',
  args: {
    title: 'gtm-agent-repo.md',
    subtitle: 'knowledge/gtm-agent-repo.md',
    eyebrow: 'Artifact',
    markdown: MARKDOWN_SOURCE,
    mode: 'preview',
  },
}

export const PreviewLight: Story = {
  name: 'Preview (light theme)',
  parameters: { backgrounds: { default: 'light' } },
  decorators: [
    (Story) => (
      <div data-theme="tangle-light" className="h-[620px] w-[900px] bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'gtm-agent-repo.md',
    subtitle: 'knowledge/gtm-agent-repo.md',
    eyebrow: 'Artifact',
    markdown: MARKDOWN_SOURCE,
    mode: 'preview',
  },
}
