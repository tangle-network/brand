---
"@tangle-network/ui": patch
---

InlineThinkingItem previews reasoning as plain text (no `**` or `#` marks), and takes `openWhileActive` (default true) so a product can keep a live reasoning row closed until the reader opens it. Adds `plainTextFromMarkdown` to the utils.
