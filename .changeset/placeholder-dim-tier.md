---
"@tangle-network/ui": patch
---

Input, Textarea, Select and the terminal prompt draw placeholder text in `--text-dim`, the faintest text tier, instead of `muted-foreground`. An empty field's example text no longer looks like an entered value; `--text-dim` still clears 4.5:1 on the field well in both themes.
