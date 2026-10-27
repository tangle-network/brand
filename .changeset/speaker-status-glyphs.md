---
"@tangle-network/ui": patch
---

`SpeakerHeader` draws its Answering and Failed glyphs with `RunStatusIcon`, and an `AgentTimeline` status card with tone `error` shows the failed glyph (`statusMeta("failed")`, CircleX) instead of the warning triangle. On a narrow row a speaker's handle now takes only the space its name and state leave, so the name never shows an ellipsis while the handle can still give way.
