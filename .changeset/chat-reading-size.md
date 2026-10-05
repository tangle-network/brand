---
"@tangle-network/ui": patch
---

Chat text renders at the 15px body size. The user bubble, assistant prose, legacy `ChatMessage` and thinking timer wrote their size tokens as `text-[var(--font-size-*)]`, which Tailwind compiles to a color, so assistant prose fell back to the Markdown default of 14px and the user bubble inherited 16px. They now use `text-[length:var(...)]`, and the dist check fails on the untyped form.

The streaming caret follows the last word instead of starting a new line. A code block that scrolls sideways takes keyboard focus as a named region (axe `scrollable-region-focusable`). The Show more toggle under a tool's output or error sits inside the card's inset instead of against its edge.
