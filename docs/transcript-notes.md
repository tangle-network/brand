# Application-composed transcript text

`TextPart.synthetic: true` identifies application-composed text, not words authored
by the user or agent. Both `ChatContainer` presentations (`runs` and `timeline`)
render non-empty synthetic text as a visibly labelled **Application note**, with
an accessible `note` role. This is default rendering, not a second transcript
adapter or an opt-in prop.

Notes preserve message/part order, including notes between tool calls and
messages containing only notes. User text still joins into the existing bubble
until a synthetic boundary interrupts it. Application notes sit outside user
and plain-assistant bubbles. Notes in a run's tool trace retain their explicit
application label and use the neutral spine treatment.

Notes are plain React text. Markdown, HTML, and OpenUI-like strings in a note are
not interpreted as markup or actions. Missing-evidence and delivery messages do
not become agent responses: the existing run response counts and summary
extraction still exclude synthetic parts. A note-only pending assistant message
still shows the pending-response treatment.

Whitespace-only notes do not render. UserMessage's explicit `content` prop still
overrides `parts`, including an explicitly empty string. Existing message/tool
actions retain their arguments; split user messages show their actions once,
after all text and notes. No public exports or signatures are changed.

Manual run collapse and the caller's optional `collapseTimelineAfter` limit may
hide notes with the other trace rows; expanding restores their order. Timeline
limits continue to count every non-user-message row as a step, including notes.
A UI step count is not an agent response count.

## Validation surfaces

- `chat-container.synthetic.test.tsx`: the maintained ChatContainer, RunGroup,
  UserMessage, AgentTimeline, and grouping hooks, with real DOM interactions.
- `synthetic-text.test.tsx`: user boundaries and the existing direct-content,
  timestamp, and action contracts.
- Storybook **Chat / Transcript notes**: mixed content in both presentations,
  note-only data, and pending responses. Append and inspect controls update local
  example state. Mixed stories include browser play assertions; a Storybook build
  alone does not execute them.

Run the repository's normal typecheck, tests, build, packed-package smoke, and
Storybook build. No dependency, release-workflow, or downstream application change
is part of this fix. This document describes the contract and test surfaces, not
a claim of package publication or downstream rollout.
