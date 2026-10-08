---
"@tangle-network/brand": minor
---

Add one control and type scale. New tokens `--control-height-sm` (32px) and `--control-height-lg` (44px) sit around `--control-height` (36px, md), with `--control-text-sm|md|lg` (12/14/16px), `--font-size-label` (14px) and `--font-size-help` (12px). The Tailwind theme registers `h-control-sm|md|lg` (spacing) and `text-control-sm|md|lg`, `text-label` and `text-help`; the named-theme bridge carries them for precompiled consumers. See docs/control-scale.md.

`tangle-drift` gates four new counts per surface: `font_size_literal` (`text-[13px]`, inline `fontSize`, CSS `font-size: 13px`), `size_literal` (`h-[34px]`, `min-h-[…]`, `size-[…]`), `native_control` (`<button>`, `<input>`, `<select>`, `<textarea>`) and `control_override` (a shared control resized or retyped through `className`). The shipped baseline records them from each default branch, adds the `insurance` surface, and lowers sandbox and intelligence to their current counts. A metric missing from a baseline row is reported as not yet gated instead of failing, so a consumer's own baseline file keeps passing until it is refreshed.
