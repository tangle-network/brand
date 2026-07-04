---
"@tangle-network/brand": minor
"@tangle-network/ui": patch
---

Transcript spacing, markdown styling, and the remaining WCAG AA fixes.

- **Markdown was unstyled**: `@tailwindcss/typography` isn't loaded and `tangle-prose` was undefined, so structured markdown had no styling — table cells collided (no dividers/padding) and text ran flush into code blocks. Defined `tangle-prose` (self-contained, theme-tokened): tables get border-collapse hairline dividers + cell padding, and blocks (headings, paragraphs, lists, `pre`, code) get proper vertical rhythm. Links use `--accent-text` (readable in every theme).
- **Timeline spacing**: user messages sat flush against the status/tool/agent row below them. They're off-spine, so they now carry their own vertical rhythm (`mt-6 mb-4`).
- **WCAG AA (measured live across 7 themes)**: `--btn-primary-*` (dark + all named themes were 4.47/2.98 → now ≥5.9 via `#5B4ED4`/`#4F46E5`); `--hsl-destructive` button/badge (3.67 → ≥4.5); named light themes now carry light-tuned `--hsl-destructive`/`--hsl-secondary-foreground`/`--surface-neutral-text` (were inheriting dark values, secondary badge ~1.05); input borders (`--input` → `--hsl-muted-foreground`) now clear 1.4.11 3:1 as visible field boundaries.
