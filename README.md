# @tangle-network/brand

Single source of truth for the Tangle design system. Design tokens, fonts, logo, and a Tailwind v4 theme preset, shared across every Tangle app (`tangle-website`, `sandbox-ui`, `evals`, `agent-builder`, product surfaces).

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

- Google Fonts (Geist, Geist Mono, Outfit, Manrope, Inter)
- CSS custom properties for dark (`:root`) and light (`[data-sandbox-theme="vault"]`)
- Tailwind v4 `@theme` block so `bg-brand`, `text-fg-muted`, `rounded-lg`, `font-display`, etc. just work
- Base styles and a handful of utility classes (`.text-gradient-brand`, `.depth-1..4`, `.status-dot-*`)

### Finer control

```css
@import "@tangle-network/brand/styles/fonts";
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
- **Fonts** — Geist (UI), Outfit (display, dark), Manrope (display, light), Inter (body, light), Geist Mono (code)
- **Radii** — 6/8/12/16px (dark); 2/4/6/8px (light/"vault")

Light theme activates via `data-sandbox-theme="vault"` on a parent element.

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
