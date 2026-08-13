---
"@tangle-network/ui": minor
---

Export `RunRowShell` (+ `RunRowStatusDot`, `RunRowStatus`) from the `/run` entry. The shell is the shared run-row grammar beneath `InlineToolItem`/`InlineThinkingItem`; consumers whose row carries behaviors the fixed items don't model (a treated title, a streaming plain-text body) can now compose the grammar directly instead of re-forking it.
