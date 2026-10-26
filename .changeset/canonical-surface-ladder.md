---
"@tangle-network/brand": minor
"@tangle-network/ui": patch
---

The canonical spine (`:root`, `.dark`, `.light`, `data-theme` `dark`, `light`
and `tangle-dark`) has a real surface ladder. `--hsl-raised` is now the spine's
L3 plane and `--hsl-raised-2` its L4 plane, instead of both repeating the card,
and every adjacent plane and well is at least 4.4 OKLCH L apart (gated in
`surface-ladder.test.ts`):

- Dark: page `#0a0a14`, card `#191826`, raised `#252237`, raised-2 and popover
  `#312e47`. A field in a raised card takes the card colour instead of the page's
  near-black well, and dark cards and menus carry the 1px top highlight
  (`--edge-highlight`).
- Light: page `#eceef3`, card white, raised `#edeff4`, raised-2 white. A field in
  a raised card is white.

`--hsl-secondary` and `--hsl-popover` moved with the ladder (dark `#221f33` to
`#252237`, `#2c2942` to `#312e47`; light `#f2f3f8` to `#edeff4`). Named themes
other than Hospitality keep their flat ladder.

One hairline: `--border-subtle` and `--border-default` now alias `--hsl-border`
in the spine, so every divider, card edge and table rule renders one colour. The
dark hairline is `#37364a` (1.5:1 on the card, as documented; it measured 1.2:1).
`--glass-border-hover` now follows `--border-hover`.

The `--font-size-xs`, `-sm`, `-base` and `-lg` tokens now equal Tailwind's
`text-xs`, `text-sm`, `text-base` and `text-lg` (12, 14, 16 and 18px; they were
11, 12, 15 and 16px), so `sm` means 14px in CSS and in a class. `text-eyebrow`,
the `Heading` eyebrow and subsection variants and `.tangle-api-meta` keep their
rendered sizes on the new steps. Code that relied on the old values reads
`--font-size-xs` for 12px captions and `--font-size-base` for 16px emphasis.
