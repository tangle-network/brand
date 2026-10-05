---
"@tangle-network/ui": minor
---

Add `Tag`, `Chip` and `IconTile` on brand's categorical tones, plus `toneFor`, `CATEGORY_TONES` and `TONE_CLASSES`.

- `Tag`: a static label (tone, `soft` or `outline` emphasis, `sm` or `md`), squared off so a category never shares the status pill's round silhouette. `onRemove` adds a native, named remove button.
- `Chip`: a native button. Without `selected` it is an action chip; with `selected` it is a filter or toggle with `aria-pressed`, and a selected chip shows a check, a stronger border and a deeper fill, never colour alone.
- `IconTile`: a square identity mark that falls back from an image to a glyph to initials, with a stable tone derived from the name. Decorative unless `label` is given.

`StatusPill` remains the one status primitive. `Badge`'s sandbox lifecycle variants (`running`, `creating`, `stopped`, `warm`, `cold`, `deleted`) are deprecated compatibility over the status triples: `running` now paints success (was teal), `creating` info (was violet) and `warm` warning (was orange). No export is removed.
