# Changelog

## 0.2.0 — 2026-05-04

- **Breaking:** stops shipping fonts (`src/styles/fonts.css` removed, `./styles/fonts.css` export removed). Consumer apps must now load fonts themselves via `@fontsource/*` (recommended) or HTML `<link>`. Reasoning:
  - `@import url(...)` inside library CSS breaks downstream when CSS chain-imports get reordered (mirrors `tangle-network/sandbox-ui#28`).
  - Library-shipped Google Fonts requests are privacy-hostile.
  - Consumers cannot fall back when the network fails.
  See README "Fonts" section for migration.
- Selection color updated to teal `rgba(56, 178, 172, 0.22)` for cross-package consistency with sandbox-ui.
- Added GitHub Actions release workflow (`.github/workflows/release.yml`) — auto-publishes to npm and GitHub Packages on `package.json` version bump merged to `main`.

## 0.1.0 — 2026-04-24

Initial release. Extracted from `@tangle-network/sandbox-ui` as the single source of truth for Tangle brand across every app.

- Design tokens: MD3 + shadcn HSL bridge, dark (`:root`) + light (`[data-sandbox-theme="vault"]`)
- Depth stack, status colors, brand accent (indigo), code/syntax palette
- Fonts: Geist / Geist Mono / Outfit / Manrope / Inter via Google Fonts
- Tailwind v4 `@theme` preset: `bg-brand*`, `bg-depth-*`, `text-fg*`, `text-status-*`, font-family + radii
- Logo: `TangleKnot` SVG and `Logo` composed component, sizes `sm | md | lg | xl`, optional suffix
- Base styles + utilities: `.text-gradient-brand`, `.glow-brand`, `.surface-card`, `.bg-mesh`, `.noise`, `.status-dot-*`
