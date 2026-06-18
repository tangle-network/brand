---
"@tangle-network/ui": minor
---

Share theme-aware file-format rendering across the preview and artifact surfaces. `FilePreview` now routes `code`/`json`/`yaml` through the same theme-aware `CodeBlock` the chat markdown renderer uses, so code is syntax-highlighted and theme-consistent in the artifact pane instead of monochrome. A new `files/file-format` module (`detectFileFormat`, `getFormatLabel`, `getSyntaxLanguage`, `fileExtension`) is the single source of truth for extension/MIME detection, consumed by `FilePreview`, `FileArtifactPane`, and `WriteFilePreview`. `CodeBlock` gains an optional `label` prop to display a header name independent of the highlight language.
