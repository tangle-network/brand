---
"@tangle-network/ui": patch
---

Give run/timeline tool rows a proper elevation ladder. Rows read as the same value as the canvas: `InlineToolItem` used `bg-card/40` (near-transparent) and RunGroup's OpenUI/running blocks used `bg-[var(--bg-root)]` (literally the page background). Both now use `--md3-surface-container` — one clear step above the `--bg-root` canvas — with hover/open stepping to `--md3-surface-container-high`. Rows now separate from the background instead of blending into it.
