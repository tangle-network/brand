---
"@tangle-network/ui": minor
---

`@tangle-network/ui/chat` adds `partitionBySpeaker` and `SpeakerHeader` for a turn addressed to several agents. `partitionBySpeaker(parts)` splits one assistant turn's parts by responder: a stored row by position after each speaker part, a live stream by each part's `speaker` tag, and a repeated speaker part carries that responder's end state. `SpeakerHeader` is the author line with the agent's handle and its state: answering, done (silent) or failed. `MessageAuthor` now renders children after the name and role.
