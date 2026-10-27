---
"@tangle-network/ui": patch
---

`Progress` passes its `value` to the Radix root, so the bar announces `aria-valuenow` and reads `data-state="loading"` or `"complete"`. Before this, a screen reader heard every bar as indeterminate whatever it showed.
