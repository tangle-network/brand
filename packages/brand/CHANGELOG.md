# Changelog

## 0.9.0

### Minor Changes

- 68e5053: Transcript spacing, markdown styling, and the remaining WCAG AA fixes.

  - **Markdown was unstyled**: `@tailwindcss/typography` isn't loaded and `tangle-prose` was undefined, so structured markdown had no styling — table cells collided (no dividers/padding) and text ran flush into code blocks. Defined `tangle-prose` (self-contained, theme-tokened): tables get border-collapse hairline dividers + cell padding, and blocks (headings, paragraphs, lists, `pre`, code) get proper vertical rhythm. Links use `--accent-text` (readable in every theme).
  - **Timeline spacing**: user messages sat flush against the status/tool/agent row below them. They're off-spine, so they now carry their own vertical rhythm (`mt-6 mb-4`).
  - **WCAG AA (measured live across 7 themes)**: `--btn-primary-*` (dark + all named themes were 4.47/2.98 → now ≥5.9 via `#5B4ED4`/`#4F46E5`); `--hsl-destructive` button/badge (3.67 → ≥4.5); named light themes now carry light-tuned `--hsl-destructive`/`--hsl-secondary-foreground`/`--surface-neutral-text` (were inheriting dark values, secondary badge ~1.05); input borders (`--input` → `--hsl-muted-foreground`) now clear 1.4.11 3:1 as visible field boundaries.

## 0.8.3

### Patch Changes

- 9b91ac6: Fix code syntax highlighting contrast (WCAG AA). `--syntax-*` was defined only in the dark `:root`, so in all four light themes (light, aubergine-light, arena-light, tangle-light) code rendered near-white on the light `bg-card` — foreground ~1.2:1, effectively invisible. Added a light-tuned `--syntax-*` palette (dark-on-light, all ≥4.5:1 on white) for every light scope. Also bumped the dark `--syntax-comment` (`#6B7094`→`#8b8fbc`) which failed AA (~3.4:1) across the dark-family themes. All syntax colors now pass AA on their code surface in every theme.

## 0.8.2

### Patch Changes

- 26cc012: WCAG 1.4.3 AA contrast fixes across all 7 themes (measured with a cascade-resolved contrast audit).

  - **Primary buttons**: `text-primary-foreground` on `bg-primary` was below 4.5:1 in `dark` (4.41) and `arena-light` (4.20). Darkened those two primaries (dark L 67%→62%, arena-light L 30%→27%) — all 7 themes now ≥5.0:1, hue unchanged.
  - **Status colors in the named light themes**: `aubergine-light` / `arena-light` / `tangle-light` inherited the dark `:root` bright status palette (`#f87171`/`#34D399`/…), so danger/success text + glyphs dropped to ~2.5:1 on their light surfaces. Added a shared light-tuned status palette (dark-on-light text, mirroring the base light theme) — status text now passes AA and glyphs pass 1.4.11.
  - **Running tool state**: the "running" label + spinner used `text-primary`, which fell to 2.98:1 on the dark row surface. Switched to `--accent-text` (the readable accent tier) — passes in every theme.
  - **Thinking timer**: the elapsed-seconds counter used the faint `--text-dim` tier (~3:1). Moved it to `--text-muted` (passes AA everywhere).

  Text now meets AA in all 7 themes; most pairs are AAA.

## 0.8.1

### Patch Changes

- d18fce7: Fix `[data-theme]` scopes not re-skinning components, and lift the aubergine palette off near-black so it reads as purple.

  The named themes changed `--hsl-*` spine vars, but Tailwind utilities (`bg-card`, `bg-primary`, `border-border`, `bg-surface-container*`) read the `--color-*` layer, which is declared only at `:root` — so its computed neutral value was inherited by themed subtrees regardless of the spine override (a double-indirection custom-property inheritance trap). Each `[data-theme]` scope now redeclares the `--color-*` layer directly, forcing it to recompute from that element's own `--hsl-*`. Aubergine's base lightness is raised (~7%→12–20% L, higher saturation) so surfaces read aubergine-purple instead of black.

## 0.8.0

### Minor Changes

- 46592b3: Calmer chat/run design + named multi-theme system.

  - `ChatMessage`/`RunGroup`: role labels move above the bubble (plain text-xs), avatar circles removed (`avatar`/`hideAvatar` are deprecated no-ops), `InlineToolItem` rows are taller with quiet inline failed/running text instead of uppercase pills. `ToolCallStep`/`ToolCallFeed` stories leave Storybook (source adapters remain).
  - `@tangle-network/brand` adds `themes.css`: `[data-theme]` scopes (`aubergine`, `aubergine-light`, `arena`, `arena-light`, `tangle-light`) that re-skin every component through the `@theme` semantic mappings, plus a `Foundations/Theme Showcase` story.

## 0.7.0

### Minor Changes

- e199bc7: Fix the dark theme being unresponsive to token changes + harsh on dark surfaces — root cause was the `@theme` layer.

  - **Single source of truth for semantic tokens.** `theme.css` now maps every shadcn/MD3 utility token (`--color-background/card/border/muted/popover/secondary/accent/destructive/ring/input` + `--color-surface-container*`) onto the `tokens.css` spine via `var()`, instead of leaving them undefined (forcing every app to re-define them) and hardcoding a now-stale `--color-depth-*` copy. Editing the spine in `tokens.css` now actually flows through to `bg-card` / `border-border` / `bg-muted` everywhere.
  - **Comfortable dark surface ladder.** Lift the canvas off near-black (`#0b0b0d` → `#15151a`) and spread the surface/depth/MD3 ladder so panels separate by _fill_, with the border softened (`13%` → `16%` lightness) so it recedes instead of reading as a bright outline on black.

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
