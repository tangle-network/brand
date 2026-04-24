# Changelog

## 0.1.0 — 2026-04-24

Initial release. Extracted from `@tangle-network/sandbox-ui` as the single source of truth for Tangle brand across every app.

- Design tokens: MD3 + shadcn HSL bridge, dark (`:root`) + light (`[data-sandbox-theme="vault"]`)
- Depth stack, status colors, brand accent (indigo), code/syntax palette
- Fonts: Geist / Geist Mono / Outfit / Manrope / Inter via Google Fonts
- Tailwind v4 `@theme` preset: `bg-brand*`, `bg-depth-*`, `text-fg*`, `text-status-*`, font-family + radii
- Logo: `TangleKnot` SVG and `Logo` composed component, sizes `sm | md | lg | xl`, optional suffix
- Base styles + utilities: `.text-gradient-brand`, `.glow-brand`, `.surface-card`, `.bg-mesh`, `.noise`, `.status-dot-*`
