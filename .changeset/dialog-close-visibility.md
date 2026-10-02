---
"@tangle-network/ui": minor
---

Add DialogContent hideCloseButton with a false default. It hides only the built-in close button, preserving Radix dismissal handlers, explicit close actions, variants and refs. Callers that require an explicit choice must still guard Escape/outside events and provide an accessible cancel or completion action.
