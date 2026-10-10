---
"@tangle-network/brand": patch
---

One transcript size across products: `--transcript-font-size` is 16px, the size Agent App's `ChatMessages` and Hospitality's transcript already used, instead of the 15px message body that UI's `AgentTimeline` used, so every agent app reads its transcript at one size. Markdown inside a `tangle-transcript-text` container inherits its size and leading rather than `.tangle-prose`'s own 1.7.
