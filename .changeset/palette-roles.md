---
"@tangle-network/brand": minor
---

Each colour in the canonical spine is declared once, as a role, and every other
name of that colour aliases it: planes derive from the `--hsl-*` channels, the
four indigos (`--hsl-primary` fill, `--brand-primary` mark, `--brand-cool` line,
`--accent-text` ink) carry every `brand-*`, `md3-primary*` and gradient name, and
one ink per status hue carries its `surface-*`, `status-*`, `md3-*`, `code-*`,
`syntax-*` and shadcn channel. Every public token name is kept.

Values that moved, all toward the hand-tuned inks: dark `--status-*`,
`--hsl-success`, `--hsl-warning`, `--hsl-info` and `--hsl-destructive` are the
pastel `--surface-*-text` inks instead of saturated fills (a status fill now
carries dark text, as the destructive one did); light `--hsl-warning` is the
`--surface-warning-text` orange instead of the 1.6:1 yellow; `--brand-glow` is
the accent ink (`#A5B4FC` dark, the bright indigo in light, so prose links read
on paper); `--brand-vibrant` is the brand mark; syntax and `--code-*` colours are
the status and tone inks, with keywords on the categorical violet instead of the
accent; `--hsl-primary` and `--btn-primary-bg` agree at `#4c3fc6`; the sidebar
hover and border are the spine's L3 plane and hairline; one-unit plane drifts
(`#12111f`, `#f6f7fa`, `#f1f2f7`, `#c7c6d6`) collapse onto their channels.

Tailwind's `bg-brand`, `text-brand-glow` and `bg-status-*` utilities now follow
the mode and the named theme instead of one static value. `tangle-dark` declares
nothing: `tokens.css` seeds the complete dark spine on its selector. A shared
`scripts/css-resolve.mjs` reads aliases for the generators and the style tests,
and `tokens.test.ts` holds a ratchet on hex literals per spine (28 dark, 25 light,
outside the generated tones).
