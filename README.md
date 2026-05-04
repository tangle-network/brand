# @tangle-network/brand

Single source of truth for the Tangle design system. Design tokens, logo, and a Tailwind v4 theme preset, shared across every Tangle app (`tangle-website`, `sandbox-ui`, `evals`, `agent-builder`, product surfaces).

**Scope:** tokens, not components. Components live in `@tangle-network/sandbox-ui`.

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
