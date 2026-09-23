---
"@tangle-network/brand": minor
"@tangle-network/ui": minor
---

Replace the hard 2px indigo focus ring with one soft focus treatment for every control.

brand adds `--focus-border`, `--focus-halo`, `--focus-border-danger`, `--focus-halo-danger` and `--border-strong`. Each derives from the ring, danger-ink, border and foreground tokens, so every theme, named theme and light island resolves its own values. The focus border clears 3:1 against the field in every theme, which `focus.test.ts` enforces.

ui exports `focusField`, `focusFieldWithin`, `focusFieldInvalid`, `focusRing` and `focusRingInset` from `utils`, and the primitives use them:

- `Input`, `Textarea`, `SelectTrigger` and `TerminalInput` rest on the neutral `border-border` hairline instead of the muted-text `border-input`, darken slightly on hover, and on focus shift the border to `--focus-border` with a 3px `--focus-halo` ring. The `default` and `sandbox` variants now render the same field.
- `Button`, `Tabs`, `Switch`, `Badge`, `SegmentedControl`, the dialog and toast close buttons, the auth menu trigger, and the chat and file controls show a 1px focus line with the same halo on `:focus-visible` only. A mouse click no longer draws a ring.
- Interactive `Card`, tool-preview and code-block hovers darken the border instead of tinting it indigo.

A consumer that removed the old ring with `focus-visible:ring-0` on a field should pass `focus:ring-0` instead, because the field ring now keys off `:focus`.
