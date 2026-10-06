---
"@tangle-network/ui": minor
---

Chat transcripts can carry more than one person beside the agent, such as a client and an attorney. `ChatMessage`, `UserMessage` and `AgentTimeline` message items take an optional `author` (`ChatAuthor`: `id`, `name`, optional `role` and `avatarUrl`), and `ChatMessage`, `UserMessage` and `AgentTimeline` take the reader's `viewerId`. The reader's own messages keep the end-aligned inverse bubble. Anyone else's sit at the start on a card under a `MessageAuthor` line: avatar (image, or initials on a tone keyed to the author's id), name, and role tag. An agent's author line opens its turn in `AgentTimeline` and is not repeated after each tool row. Without `author`, every component renders exactly the markup it did before. `MessageAuthor`, `isViewerMessage` and `ChatAuthor` are exported from `./chat`, and `ChatAuthor` from `./types`.
