# Changelog

## 0.6.0

### Minor Changes

- c56ea6c: Add a standard `data-theme`/`.dark`/`.light` switch alongside the existing named themes. The dark block now also matches `[data-theme="dark"]`/`.dark` and the light block also matches `[data-theme="light"]`/`.light`, so consumers can pin or toggle a theme with a standard switch instead of an ad-hoc `data-sandbox-theme` name (an unknown name previously fell back to the dark default). The `:root` default stays dark — zero blast radius to existing consumers.

## 0.5.0

### Minor Changes

- 184c8bb: Add the canonical display type scale and semantic type-role utilities. New
  tokens: `--font-size-2xl/3xl/4xl` plus fluid `--font-size-hero`/`--font-size-display`
  (clamp), display line-heights, and tracking tokens. New `@theme` utilities
  `text-display`/`text-hero`/`text-page`/`text-section`/`text-eyebrow`, each
  carrying size + leading + tracking + weight. Quiet weights (heroes 700, titles 600) per Tangle Quiet. Additive — no existing token changed.

## 0.4.0

### Minor Changes

- 8152d92: Tangle Quiet reskin: flat neutral chrome with a single indigo accent. Reworks `theme.css` and `tokens.css` so surfaces read as quiet neutrals and color is reserved for the indigo accent only.

## 0.3.0

### Minor Changes

- 2330781: Repo converted to pnpm monorepo; package contents and exports unchanged.

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
