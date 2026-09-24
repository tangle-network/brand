# @tangle-network/brand

Single source of truth for the Tangle design system. Design tokens, logo, and a Tailwind v4 theme preset, shared across every Tangle app (`tangle-website`, `sandbox-ui`, `evals`, `agent-builder`, product surfaces).

**Scope:** tokens, not components. Shared components live in `@tangle-network/ui`; product-specific components stay in their product repos.

For the broader visual, copy, graphic, and component standards, see the repo-level [brand guidelines](../../docs/brand-guidelines.md).

## Install

```bash
pnpm add @tangle-network/brand
```

## Use

### Tailwind v4 app

```css
/* app.css */
@import "@tangle-network/brand/styles";
@import "tailwindcss";
```

That single import wires:

- CSS custom properties for dark (`:root`) and light (`[data-sandbox-theme="vault"]`)
- Tailwind v4 `@theme` block so `bg-brand`, `text-fg-muted`, `rounded-lg`, `font-display`, etc. just work
- Base styles and a handful of utility classes (`.text-gradient-brand`, `.depth-1..4`, `.status-dot-*`)

Fonts are **not** bundled — see [Fonts](#fonts) below.

### Finer control

```css
@import "@tangle-network/brand/styles/tokens";
@import "tailwindcss";
@import "@tangle-network/brand/styles/theme";
@import "@tangle-network/brand/styles/globals";
```

### Colour ladders (opt in)

```css
@import "@tangle-network/brand/styles";
@import "@tangle-network/brand/styles/ladders.css";
@import "@tangle-network/brand/styles/system.css";
```

`ladders.css` defines 12 ramps of 12 steps each, in light and dark, from Radix Colors 3.0.0: mauve (neutral), iris (brand), green, amber, red and blue (status), and plum, orange, grass, bronze, crimson and olive (domains).
Each step has one job: 1–2 backgrounds, 3–5 control fills, 6–8 borders, 9–10 solid fills, 11 secondary text and 12 primary text.
Role aliases (`--gray-*`, `--accent-*`, `--success-*`, `--warning-*`, `--danger-*`, `--info-*`) point at the ramps.
Setting `data-domain="tax"` (or another domain key) on an element gives its subtree `--domain-1..12`.

`system.css` maps every token family in `tokens.css` onto a ladder step and adds semantic tokens (`--bg-page`, `--line`, `--fg-muted`, `--accent-text`, `--ink`), role radii, type roles, motion and three shadow levels.
Light pages become white, and dark becomes a neutral mauve ladder.
Import it after `tokens.css`; it is opt in because it changes every surface of the app that loads it.

Both files are generated.
Change a value in `scripts/gen-ladders.mjs` or `scripts/radix-ramps.json`, then run `pnpm --filter @tangle-network/brand gen:ladders`.
An app that ships ahead of a release copies the two generated files verbatim, so its copy stays identical.

### Logo

```tsx
import { Logo, TangleKnot } from "@tangle-network/brand";

<Logo size="lg" />
<Logo size="md" suffix="Sandbox" />
<TangleKnot size={48} />
```

## What's in the palette

- **Accent** — indigo `#6366F1` / `#818CF8` / `#A5AAFC`
- **Depth stack** — `#0C0B1D` → `#262448` (dark); `#f4f4f9` → `#dcdbe8` (light)
- **Status** — emerald / amber / coral for running / stopped / error
- **Radii** — 6/8/12/16px (dark); 2/4/6/8px (light/"vault")
- **Focus** — `--focus-border` and `--focus-halo` (plus `-danger` variants) for a focused control, and `--border-strong` for a hovered field. They derive from the ring and border tokens, so every theme gets its own. `@tangle-network/ui` applies them through `focusField` and `focusRing`. `globals.css` gives a control or native text field that styles no focus of its own a fallback: a control gets the 1px line and halo on keyboard focus, and a text field gets the 1px line over its border.

Light theme activates via `data-sandbox-theme="vault"` on a parent element.

## Fonts

brand references the following font families in its design tokens but does **not** bundle them — consumer apps must load the fonts themselves. This is deliberate:

- (a) `@import url(...)` inside library CSS breaks downstream when CSS chain-imports get reordered — once the dist CSS is inlined after any rule, the URL `@import` is no longer at the top of the merged stylesheet, the CSS spec disallows it, and PostCSS rejects the build. Mirrors `tangle-network/sandbox-ui#28`.
- (b) Shipping a third-party Google Fonts request from a library is privacy-hostile.
- (c) Consumers cannot fall back when the network fails.

| Family       | Role                                | Used as CSS variable |
| ------------ | ----------------------------------- | -------------------- |
| Geist        | UI body text (dark)                 | `--font-sans`        |
| Geist Mono   | Code, terminal                      | `--font-mono`        |
| Outfit       | Display / headings (dark)           | `--font-display`     |
| Manrope      | Display / headings (vault)          | `--font-display`     |
| Inter        | UI body text (vault)                | `--font-sans`        |

Pick one loading strategy that fits your app:

**1. Self-hosted via `@fontsource/*`** (recommended — no external network request):

```bash
pnpm add @fontsource/geist-sans @fontsource/geist-mono @fontsource/outfit @fontsource/manrope @fontsource/inter
```

```tsx
// app entry
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/700.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
```

**2. Google Fonts via HTML `<link>`:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
/>
```

Any family you omit falls back per the `--font-*` token chain.

## Policy

- **No additions without a cross-app audit.** New tokens land here or nowhere; do not fork this into apps.
- **Version as a product.** Semver. Breaking token changes are major bumps.
- **Sandbox-ui as the stress-test surface.** Tokens ship here only after sandbox-ui has used them in anger.

## Development

```bash
pnpm install
pnpm build
```

To iterate inside a consuming app, link locally:

```bash
# in ~/webb/brand
pnpm link --global

# in the consumer
pnpm link --global @tangle-network/brand
```

Or use a `file:` path dependency (`"@tangle-network/brand": "file:../brand"`).
