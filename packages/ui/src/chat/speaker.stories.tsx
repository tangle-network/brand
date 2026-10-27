import type { Meta, StoryObj } from '@storybook/react'
import { partitionBySpeaker, SpeakerHeader } from './speaker'
import { TRANSCRIPT_TEXT } from './transcript-text'

type Part =
  | { type: 'speaker'; id: string; name: string; handle?: string; state?: 'answering' | 'done' | 'failed' }
  | { type: 'text'; text: string; speaker?: string }
  | { type: 'tool'; tool: string; status: string; speaker?: string }
  | { type: 'notice'; text: string; speaker?: string }

/** One turn's parts drawn the way a product draws them: a header per responder, its parts under it. */
function Turn({ parts, live = false }: { parts: Part[]; live?: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <p className={`ml-auto w-fit max-w-[78%] rounded-2xl bg-foreground px-4 py-3 text-background ${TRANSCRIPT_TEXT}`}>
        @writer @research-lead plan the launch announcement for the roster feature.
      </p>
      {partitionBySpeaker(parts).map(({ speaker, parts: own }) => (
        <section key={speaker?.id ?? 'turn'} className="flex flex-col gap-2">
          {speaker ? <SpeakerHeader speaker={speaker} live={live} /> : null}
          {own.map((part, index) =>
            part.type === 'text' ? (
              <p key={index} className={TRANSCRIPT_TEXT}>{part.text}</p>
            ) : part.type === 'tool' ? (
              <p key={index} className="font-mono text-muted-foreground text-sm">{part.tool} · {part.status}</p>
            ) : part.type === 'notice' ? (
              <p key={index} className="text-[var(--surface-danger-text)] text-sm">{part.text}</p>
            ) : null,
          )}
        </section>
      ))}
    </div>
  )
}

const meta: Meta<typeof Turn> = {
  title: 'Chat/Speakers',
  component: Turn,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[var(--bg-root)]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Turn>

/**
 * A live turn as the stream delivers it: both responders announced first, then
 * their output interleaved, each part tagged with its responder. The Writer has
 * reported its end; the Research Lead is still answering.
 */
export const AnsweringAtOnce: Story = {
  args: {
    live: true,
    parts: [
      { type: 'speaker', id: 'ap_writer', name: 'Writer', handle: 'writer' },
      { type: 'speaker', id: 'ap_research', name: 'Research Lead', handle: 'research-lead' },
      { type: 'text', speaker: 'ap_writer', text: 'Draft headline: "Every agent in your workspace, one @ away."' },
      { type: 'tool', speaker: 'ap_research', tool: 'search_repo', status: 'running' },
      { type: 'text', speaker: 'ap_writer', text: 'Subhead: address any agent from any thread, and let it run on a schedule while you sleep.' },
      { type: 'speaker', id: 'ap_writer', name: 'Writer', handle: 'writer', state: 'done' },
      { type: 'text', speaker: 'ap_research', text: 'Checking the roster and the mention routes before naming risks.' },
    ],
  },
}

/** A stored row: a speaker part before each answer. The Research Lead failed and keeps its header and its notice. */
export const StoredWithFailure: Story = {
  args: {
    parts: [
      { type: 'speaker', id: 'ap_writer', name: 'Writer', handle: 'writer', state: 'done' },
      { type: 'text', text: 'Draft headline: "Every agent in your workspace, one @ away."' },
      { type: 'speaker', id: 'ap_research', name: 'Research Lead', handle: 'research-lead', state: 'failed' },
      { type: 'tool', tool: 'search_repo', status: 'error' },
      { type: 'notice', text: 'Research Lead could not answer: the model provider refused the request (429).' },
    ],
  },
}

/** Worst case for a phone: a long name and handle while answering. The name and handle truncate; the state stays whole. */
export const LongNames: Story = {
  args: {
    live: true,
    parts: [
      { type: 'speaker', id: 'ap_compliance', name: 'Regional Compliance and Disclosure Reviewer', handle: 'regional-compliance-disclosure-reviewer' },
      { type: 'text', text: 'Reading the disclosure rules for each launch region.' },
      { type: 'speaker', id: 'ap_q', name: 'Q', state: 'failed' },
    ],
  },
}
