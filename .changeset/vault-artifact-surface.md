---
"@tangle-network/ui": minor
---

feat(files): host-aligned artifact surface props

- `ArtifactPane`: `headerClassName` + `hideTitleBlock` (header row collapses when empty).
- `FileArtifactPane`: threads both through all render paths; `headerActions` is `undefined` (not an empty fragment) when there are no actions.
- `DocumentEditorPane`: `previewClassName` now governs the whole preview box (gutter/border/surface/padding), enabling a full-bleed document body.
- `FilePreview`: text previews sit on `bg-card` for a white surface in light theme.
