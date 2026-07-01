---
"@tangle-network/ui": minor
"@tangle-network/brand": minor
---

Calmer chat/run design + named multi-theme system.

- `ChatMessage`/`RunGroup`: role labels move above the bubble (plain text-xs), avatar circles removed (`avatar`/`hideAvatar` are deprecated no-ops), `InlineToolItem` rows are taller with quiet inline failed/running text instead of uppercase pills. `ToolCallStep`/`ToolCallFeed` stories leave Storybook (source adapters remain).
- `@tangle-network/brand` adds `themes.css`: `[data-theme]` scopes (`aubergine`, `aubergine-light`, `arena`, `arena-light`, `tangle-light`) that re-skin every component through the `@theme` semantic mappings, plus a `Foundations/Theme Showcase` story.
