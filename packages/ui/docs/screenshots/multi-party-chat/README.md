# Multi-party chat

The `Chat/Multi-party transcript` stories render the actual `AgentTimeline`, `ChatMessage` and `MessageAuthor` components with one intake thread: a client (Maria Lopez), an attorney (Jane Doe) and the agent.

Captured with Playwright 1.63 Chromium from a static Storybook build on beelink1-wsl, at 1280px (1x) and 360px (2x), full page, in the `dark` and `light` Storybook themes.
The after images are from commit 468c927; no capture had horizontal overflow.
The before images are the same story built against the unchanged components at 3095584, which ignore `author` and `viewerId`: the attorney's messages render as the client's own.

| File | Story | Shows |
| --- | --- | --- |
| `before-client-view-*` | ClientView, before | Jane's questions are right-aligned inverse bubbles, identical to Maria's answers. |
| `after-client-view-*` | ClientView | Maria's messages stay right-aligned; Jane's sit on cards under her name and role; the agent is named once per turn, not after the tool row. |
| `after-attorney-view-light-360` | AttorneyView | The same thread from Jane's side: her messages move to the end and Maria's are named. |
| `after-labeled-messages-dark-360` | LabeledMessages | `ChatMessage` keeps "You" for the reader and names everyone else. |
| `after-edge-cases-dark-360` | EdgeCases | A long name and role truncate, a one-letter name with no role, an image avatar, a failing image that falls back to initials, and an unbroken string that wraps. |
