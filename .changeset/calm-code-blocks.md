---
"@tangle-network/ui": patch
---

Load the full Highlight.js syntax renderer only when a code block mounts.
Keep code readable until highlighting arrives, and leave prose-only Markdown free of syntax-engine requests.
