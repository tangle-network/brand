---
"@tangle-network/brand": minor
"@tangle-network/ui": minor
---

Surface ladder and one interaction language.

Brand: Hospitality gets a stepped ladder (light page 91.6, white cards with a two-layer shadow, raised 95.6; dark page 16.9, card 31.1, raised 37.9 with a top highlight, popover 42.0), field wells that are always the opposite step from their parent, a 3:1 `--field-border`, darker muted text, and status fills retuned for its planes (success, warning, danger, neutral). Dark accent text (#b2dbc2) and the dark destructive red (0 80% 88%) are lifted so they keep 4.5:1 on the lighter raised and popover planes. New tokens `--hsl-raised`, `--hsl-raised-2`, `--well-page`, `--well-card`, `--well-raised`, `--well-raised-2`, `--well`, `--field-border`, `--shadow-raised`, `--shadow-well` and `--edge-highlight` default to the plain spine, so other themes look as before. Shared `--ix-hover`, `--ix-hover-border`, `--ix-press`, `--ix-after`, `--ix-sel-ring`, `--ix-sel-bg` and `--ix-hover-bg` derive from `--hsl-ring`. A `[data-slot="card"]` rule re-declares `--card` and `--well` per card level.

UI: new `ixControl`, `ixControlAfter`, `ixControlSoft`, `ixField`, `ixSelected`, `ixTabUnderline` and `ixRow` (exported from `@tangle-network/ui/utils`) give hover, press, after-click and selected states in the focus ring hue; the keyboard focus glow is unchanged. Button, Input, Textarea, `focusFieldWithin`, SelectTrigger/Item/Content, DropdownMenu content and items, Card, SegmentedControl and TabsTrigger apply them. Card renders `data-slot="card"` with `--edge-highlight` + `--shadow-card`, gains `interactive`, and CardDescription clamps at two lines. Select and DropdownMenu content paint the popover level. See docs/surfaces-and-states.md.
