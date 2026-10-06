import type { Meta, StoryObj } from '@storybook/react'
import { AgentTimeline, type AgentTimelineItem } from './agent-timeline'
import { ChatMessage } from './chat-message'
import { MessageAuthor } from './message-author'
import type { ChatAuthor } from '../types/message'

const client: ChatAuthor = { id: 'client-maria-lopez', name: 'Maria Lopez', role: 'Client' }
const attorney: ChatAuthor = { id: 'attorney-jane-doe', name: 'Jane Doe', role: 'Attorney' }
const agent: ChatAuthor = { id: 'agent-intake', name: 'Intake assistant', role: 'AI' }

const NOW = Date.now()
const t = (offsetMinutes: number) => new Date(NOW - offsetMinutes * 60 * 1000)

const intakeThread: AgentTimelineItem[] = [
  {
    id: 'm1',
    kind: 'message',
    role: 'user',
    author: client,
    timestamp: t(42),
    content:
      'My landlord kept my $2,400 security deposit and never sent an itemized list. I moved out on August 31. What can I do?',
  },
  {
    id: 'm2',
    kind: 'message',
    role: 'assistant',
    author: agent,
    content:
      'In California a landlord has 21 days after move-out to return the deposit or send an itemized statement of deductions. That window closed on September 21.\n\nThis looks like a case an attorney should review, so I have shared your summary with Jane Doe.',
  },
  {
    id: 'tool-1',
    kind: 'tool',
    call: {
      id: 'tc-1',
      type: 'write',
      label: 'Write',
      status: 'success',
      detail: 'intake/deposit-dispute-summary.md',
    },
  },
  {
    id: 'm3',
    kind: 'message',
    role: 'assistant',
    author: agent,
    content: 'The summary includes your lease dates and the deposit amount.',
  },
  {
    id: 'm4',
    kind: 'message',
    role: 'user',
    author: attorney,
    timestamp: t(30),
    content: 'Hi Maria, I am Jane. Did you give the landlord a forwarding address in writing?',
  },
  {
    id: 'm5',
    kind: 'message',
    role: 'user',
    author: client,
    timestamp: t(27),
    content: 'Yes, I emailed it to the property manager on August 28.',
  },
  {
    id: 'm6',
    kind: 'message',
    role: 'assistant',
    author: agent,
    content: 'I added the August 28 email to the case file.',
  },
  {
    id: 'm7',
    kind: 'message',
    role: 'user',
    author: attorney,
    timestamp: t(20),
    content: 'Thanks. I will draft a demand letter today, and you will have it to review by 5pm.',
  },
]

const meta: Meta<typeof AgentTimeline> = {
  title: 'Chat/Multi-party transcript',
  component: AgentTimeline,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[var(--bg-root)]">
        <div className="mx-auto max-w-3xl">
          <Story />
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AgentTimeline>

/** The client's screen: their own messages at the end, the attorney and the agent at the start. */
export const ClientView: Story = {
  args: { items: intakeThread, viewerId: client.id },
}

/** The same thread on the attorney's screen. */
export const AttorneyView: Story = {
  args: { items: intakeThread, viewerId: attorney.id },
}

/** No viewer, as in an audit log: every person is someone else, so every message is named. */
export const ObserverView: Story = {
  args: { items: intakeThread },
}

/** `ChatMessage` with always-on labels: the reader keeps "You", everyone else is named. */
export const LabeledMessages: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <ChatMessage role="user" author={client} viewerId={client.id} timestamp={t(42)} content="My landlord kept my $2,400 security deposit and never sent an itemized list." />
      <ChatMessage role="assistant" author={agent} content="That window closed on September 21. I have shared your summary with Jane Doe." />
      <ChatMessage role="user" author={attorney} viewerId={client.id} timestamp={t(30)} content="Hi Maria, I am Jane. Did you give the landlord a forwarding address in writing?" />
    </div>
  ),
}

const longName: ChatAuthor = {
  id: 'attorney-long',
  name: 'Alexandria Montgomery-Vandenberghe Castellanos',
  role: 'Senior supervising attorney, tenant rights',
}
const noRole: ChatAuthor = { id: 'guest-1', name: 'Q' }
const withImage: ChatAuthor = {
  id: 'paralegal-sam',
  name: 'Sam Okafor',
  role: 'Paralegal',
  avatarUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><rect width='20' height='20' fill='%236366f1'/><circle cx='10' cy='8' r='4' fill='white'/><rect x='4' y='13' width='12' height='7' rx='3' fill='white'/></svg>",
}
const brokenImage: ChatAuthor = { id: 'client-broken', name: 'Lee Park', role: 'Client', avatarUrl: 'https://invalid.example/avatar.png' }

/** Worst cases: a long name and role, a one-letter name with no role, an image, a failing image. */
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <MessageAuthor author={longName} />
        <MessageAuthor author={noRole} />
        <MessageAuthor author={withImage} />
        <MessageAuthor author={brokenImage} />
      </div>
      <AgentTimeline
        className="px-0"
        viewerId={client.id}
        items={[
          {
            id: 'e1',
            kind: 'message',
            role: 'user',
            author: longName,
            content: 'Superlongunbrokenidentifierwithoutanyspaces_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          },
          { id: 'e2', kind: 'message', role: 'user', author: noRole, content: 'ok' },
        ]}
      />
    </div>
  ),
}
