---
"@tangle-network/ui": patch
---

Menu separators (`DropdownMenuSeparator`, `ContextMenuSeparator`, `SelectSeparator`) draw in `--border-strong` instead of `--border`. On the dark popover the old line measured 1.1:1 against its surface and disappeared, so a closing action such as Billing read as one more choice in the list above it. It now measures 1.8:1 in dark and 2.3:1 in light.
