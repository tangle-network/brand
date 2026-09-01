# @tangle-network/ui

## 11.8.0

### Minor Changes

- 3416c80: `FileArtifactPane` (and `FilePreview`, its body) now previews every file kind a sandbox produces, so a product no longer builds its own image, PDF, CSV, video, audio, or spreadsheet viewers. Pass `blobUrl` (an object URL or remote URL) for binary content and the pane renders an image fit to the pane on a checker ground (click for natural size), a PDF at full pane height, or a video/audio player; pass `content` for CSV and the pane parses quoted commas and line breaks (RFC 4180) into a sticky-header table capped at `CSV_PREVIEW_ROW_LIMIT` (500) rows with a "Showing N of M rows" line; an `.xlsx`/`.xls` file renders a download card with the filename, its size when the new optional `size` prop (bytes) is set, and a Download button wired to `onDownload`. A file with no `blobUrl` and no text content renders one sentence, "This file needs a download link to preview.", with the same Download button. Text, code, JSON, YAML, and markdown render as before. `@tangle-network/ui/files` also exports the pure `resolveFilePreviewKind(filename, mimeType)` helper (`FilePreviewKind`: MIME type wins over extension; anything unmatched is `binary`), `parseCsv`, and `CSV_PREVIEW_ROW_LIMIT`; `detectFileFormat` gains the `video` and `audio` formats and the `avif` image extension.

## 11.7.0

### Minor Changes

- 0982a63: Quiet transcript rows: the agent transcript (`AgentTimeline`, `ChatContainer`'s `timeline` presentation) now reads as one column of prose with tool calls as quiet one-liners between the paragraphs. `RunRowShell` (and so `InlineToolItem` / `InlineThinkingItem`) rests with no card chrome — transparent border and fill, a bare 14px glyph, title and description at `text-sm` in `text-muted-foreground` that brighten on hover — and takes the bordered `--md3-surface-container` card only while open; the expand chevron replaces the glyph on hover and open, the success dot is gone (success is silence), the running spinner and live-ticking duration are gone (a running row shimmers its title through the new `TextShimmer` primitive, exported from `/primitives`), and the completed duration shows on hover only. `RunRowStatusDot` still exists and now draws only the error dot; `RunRowShellProps.startTime` is accepted and ignored (deprecated). `getToolDisplayMetadata` titles are the bare verb (`Read`, `Edit`, `Write`, `Shell`, `Search`, `Find`, `Web search`, `Fetch`, `Task`) and the path, command, pattern or query lives in `description` only, so a row no longer prints its subject twice; `targetPath` / `commandSnippet` are unchanged. `AgentTimeline` drops the connector spine, the uppercase "Tool activity" header above grouped calls (the group keeps that name as its `aria-label`), and the per-block timestamp on assistant prose; prose renders at 15px/1.5 with a muted streaming caret, and vertical rhythm now follows the pair of neighbours (`mt-4` at a user turn, `mt-1` inside tool sequences and between prose and tools). `UserMessage` loses its border and shows its timestamp beside the bubble on hover. Consumers that composed `RunRowShell` with a shimmer title of their own get the intended result now that the shell draws no spinner beside it.

## 11.6.0

### Minor Changes

- b52965b: Load the `./editor` entry's optional peers through a dynamic `import()`.

  The entry declares `@tiptap/*`, `@hocuspocus/provider` and `yjs` as optional peers, but reached them through static imports. A bundler resolves an uninstalled optional peer to a stub module that carries a default export only, so `import { EditorContent } from "@tiptap/react"` and `import { HocuspocusProvider } from "@hocuspocus/provider"` failed the build of every consumer that did not install them, with `MISSING_EXPORT`. The failure was not limited to `./editor`: `./files` reaches `DocumentEditorPane` through a lazy import, so `@tangle-network/ui/files` failed the same way.

  `EditorProvider`, `TiptapEditor` and the local markdown editor are now built from namespaces that `loadCollaborationPeers`/`loadDocumentEditorPeers` resolve at first render. A consumer without the peers builds clean and sees an error that names the packages to install, and only when it renders an editor. Preview-only use of `DocumentEditorPane` needs no peer at all. The two loaders stay separate so the local markdown editor still runs on `@tiptap/react` and `@tiptap/starter-kit` alone, without yjs or Hocuspocus.

  A bundler reads the literal specifier in a dynamic `import()`, so the clean build is not automatic in every bundler. Vite and Rollup leave the unresolved peer to run time on their own. esbuild does so only when the call carries a `.catch()`, which every peer import now has, and `pnpm test:package` builds the packed consumer under esbuild as well as Vite to hold that. webpack has no such rule: a webpack consumer that installs none of the peers must give `resolve.fallback` the value `false` for each one, which `packages/ui/README.md` documents.

  `EditorProvider` loads `yjs` and `@hocuspocus/provider` on its own, through `loadEditorProviderPeers`. It reads no tiptap namespace, so a consumer that installs those two peers and drives its own editor from the provider's context keeps working — the same set the provider imported statically before.

  Rendering an editor now goes through a `Suspense` boundary: `TiptapEditor` and the local editor show a "Loading editor…" placeholder for the first frame, and `EditorProvider` renders its children only after the peers land, because every child hook reads a context that only the loaded provider supplies.

## 11.5.0

### Minor Changes

- 8dbe359: Export `RunRowShell` (+ `RunRowStatusDot`, `RunRowStatus`) from the `/run` entry. The shell is the shared run-row grammar beneath `InlineToolItem`/`InlineThinkingItem`; consumers whose row carries behaviors the fixed items don't model (a treated title, a streaming plain-text body) can now compose the grammar directly instead of re-forking it.

## 11.4.0

### Minor Changes

- ef1be75: Publish the redaction renderer on its own `./redaction` subpath.

  `RedactedDocument` is the client half of agent-app's reversible redaction: agent-app builds a document of masked spans and reveals one at a time through `revealSpan`, where authorization and the audit record happen, and this component renders that document and calls back for a reveal. It reached the package only through the root entry, and no consumer imports the bare package — every app takes ui through a subpath — so the component was unreachable in practice.

  The module gains a header stating what it pairs with, including why its segment type omits the `cipher` that agent-app's carries: the ciphertext stays on the server, so the type a browser holds cannot name it.

- b7c12be: `RunRowShell`'s `title` prop widens from `string` to `ReactNode` — purely additive (strings render unchanged). Lets a row carry a treated title (e.g. an active-state shimmer sweep) so consumers composing the canonical run-row grammar don't have to re-fork the shell for it.

## 11.3.0

### Minor Changes

- e67a809: Raise the dark surface ladder to AA and add the page-level primitives.

  In the dark spine, `--md3-surface-container-high` and `--md3-surface-container-highest` sat close enough to the ink ramp that `--text-dim` fell under 4.5:1 on them. The ladder is re-spaced and the ink ramp moves with it, so every ink tier clears AA on all five planes.

  Dark status chips keep their hue, drop 14% chroma, and lift the fill to 1.50:1 from the card. A new `--run-mix-*` ramp carries proportional bars, spaced in relative luminance so adjacent segments clear the 3:1 floor for non-text contrast.

  One light token moves: `--surface-warning-text` goes `#b45309` to `#ab4f09`. It is a contrast fix, not a hue change. The old value measured 4.16:1 on the light page canvas, under the 4.5:1 body floor, whenever the colour was used as text away from its own pill background; the new value measures 4.51:1 there and 5.25:1 on the pill. Every other light value is unchanged.

  `@tangle-network/ui` gains four primitives: `PageHeader`, `StatusPill`, `MetricStrip`, and `Toolbar`/`FilterField`. All additive; no existing export changes.

## 11.2.4

### Patch Changes

- 2088fb9: Retune the token spine to a neutral-grey surface ladder with indigo as trim rather than as field, in both themes. Surfaces separate by their own fill so a card, a nested panel and an overlay each read as a distinct plane, and the canvas sits off pure black so long reading sessions land away from the glare end of the range.

  Faint text in `Input`, `Textarea`, `StatCard` and `TerminalLine` now takes a dedicated `--text-dim` token instead of a faded stronger one. A translucent foreground renders as its colour composited over the plane behind it, so those hints, subtitles and timestamps measured differently on a card than on the canvas and fell under the 4.5:1 floor on both.

  **Worth a look after upgrading:** in dark mode `--sidebar-background` is now one step BELOW the canvas rather than above it, so the nav reads as chrome the content sits in front of instead of as another raised card. Apps that composited their own surfaces on top of the sidebar assuming it was the lighter plane should give that area a visual pass. Light mode is unchanged — the sidebar is still paper on a grey canvas.

## 11.2.3

### Patch Changes

- 7eeed23: Show the animated thinking row immediately after a user submits a message, before the first assistant event arrives.

## 11.2.2

### Patch Changes

- 172d68a: Accept React Router 8 as a supported peer dependency.

## 11.2.1

### Patch Changes

- 8dd0d68: Declare the editor and session-store optional peers in the published manifest and prove every packed public export in a clean consumer before release.

## 11.2.0

### Minor Changes

- ac4eaf4: feat(files): host-aligned artifact surface props

  - `ArtifactPane`: `headerClassName` + `hideTitleBlock` (header row collapses when empty).
  - `FileArtifactPane`: threads both through all render paths; `headerActions` is `undefined` (not an empty fragment) when there are no actions.
  - `DocumentEditorPane`: `previewClassName` now governs the whole preview box (gutter/border/surface/padding), enabling a full-bleed document body.
  - `FilePreview`: text previews sit on `bg-card` for a white surface in light theme.

### Patch Changes

- c5dfc7d: Use tokenized Tangle prose styling for markdown previews so light themes stay readable.

## 11.1.0

### Minor Changes

- ea6f23e: Unify the agent reasoning and tool rows onto one shared row shell: both keep a
  consistent semantic lead icon with a small trailing status dot/spinner (status
  no longer hijacks the icon), on a calm neutral badge that is uniform across
  reasoning and tool rows. Expanded and open rows read as the same surface as
  their collapsed siblings (no background elevation), the reasoning body inherits
  the card surface and stays readable in dark mode, and the timeline spine dot is
  centered on card rows. Add a per-row content clamp with "Show more/less" for
  long reasoning text and tool output, and an opt-in `collapseAfter` on
  `AgentTimeline` (threaded as `collapseTimelineAfter` on `ChatContainer`) that
  collapses the timeline to the first N steps behind a "Show N more steps" toggle.

## 11.0.0

### Patch Changes

- Updated dependencies [0ef3a1a]
  - @tangle-network/brand@1.0.0

## 10.0.0

### Patch Changes

- 68e5053: Transcript spacing, markdown styling, and the remaining WCAG AA fixes.

  - **Markdown was unstyled**: `@tailwindcss/typography` isn't loaded and `tangle-prose` was undefined, so structured markdown had no styling — table cells collided (no dividers/padding) and text ran flush into code blocks. Defined `tangle-prose` (self-contained, theme-tokened): tables get border-collapse hairline dividers + cell padding, and blocks (headings, paragraphs, lists, `pre`, code) get proper vertical rhythm. Links use `--accent-text` (readable in every theme).
  - **Timeline spacing**: user messages sat flush against the status/tool/agent row below them. They're off-spine, so they now carry their own vertical rhythm (`mt-6 mb-4`).
  - **WCAG AA (measured live across 7 themes)**: `--btn-primary-*` (dark + all named themes were 4.47/2.98 → now ≥5.9 via `#5B4ED4`/`#4F46E5`); `--hsl-destructive` button/badge (3.67 → ≥4.5); named light themes now carry light-tuned `--hsl-destructive`/`--hsl-secondary-foreground`/`--surface-neutral-text` (were inheriting dark values, secondary badge ~1.05); input borders (`--input` → `--hsl-muted-foreground`) now clear 1.4.11 3:1 as visible field boundaries.

- Updated dependencies [68e5053]
  - @tangle-network/brand@0.9.0

## 9.1.3

### Patch Changes

- 26cc012: Give run/timeline tool rows a proper elevation ladder. Rows read as the same value as the canvas: `InlineToolItem` used `bg-card/40` (near-transparent) and RunGroup's OpenUI/running blocks used `bg-[var(--bg-root)]` (literally the page background). Both now use `--md3-surface-container` — one clear step above the `--bg-root` canvas — with hover/open stepping to `--md3-surface-container-high`. Rows now separate from the background instead of blending into it.
- 26cc012: One user-message bubble. There were two: the exported `UserMessage` (a loud filled purple bubble with an uppercase "You" label + shadow, used by the run/message list) and a separate cleaner inline bubble inside `AgentTimeline`. Unify on the clean one — `UserMessage` is now a quiet right-aligned bordered bubble on the muted surface (no fill, no uppercase label), and `AgentTimeline` renders through it instead of its own copy. `UserMessage` accepts either session-model `parts` or a direct `content`/`timestamp`, so both call sites share it.
- 26cc012: WCAG 1.4.3 AA contrast fixes across all 7 themes (measured with a cascade-resolved contrast audit).

  - **Primary buttons**: `text-primary-foreground` on `bg-primary` was below 4.5:1 in `dark` (4.41) and `arena-light` (4.20). Darkened those two primaries (dark L 67%→62%, arena-light L 30%→27%) — all 7 themes now ≥5.0:1, hue unchanged.
  - **Status colors in the named light themes**: `aubergine-light` / `arena-light` / `tangle-light` inherited the dark `:root` bright status palette (`#f87171`/`#34D399`/…), so danger/success text + glyphs dropped to ~2.5:1 on their light surfaces. Added a shared light-tuned status palette (dark-on-light text, mirroring the base light theme) — status text now passes AA and glyphs pass 1.4.11.
  - **Running tool state**: the "running" label + spinner used `text-primary`, which fell to 2.98:1 on the dark row surface. Switched to `--accent-text` (the readable accent tier) — passes in every theme.
  - **Thinking timer**: the elapsed-seconds counter used the faint `--text-dim` tier (~3:1). Moved it to `--text-muted` (passes AA everywhere).

  Text now meets AA in all 7 themes; most pairs are AAA.

- Updated dependencies [26cc012]
  - @tangle-network/brand@0.8.2

## 9.1.2

### Patch Changes

- d50f746: Give run/timeline tool rows a proper elevation ladder. Rows read as the same value as the canvas: `InlineToolItem` used `bg-card/40` (near-transparent) and RunGroup's OpenUI/running blocks used `bg-[var(--bg-root)]` (literally the page background). Both now use `--md3-surface-container` — one clear step above the `--bg-root` canvas — with hover/open stepping to `--md3-surface-container-high`. Rows now separate from the background instead of blending into it.
- d50f746: One user-message bubble. There were two: the exported `UserMessage` (a loud filled purple bubble with an uppercase "You" label + shadow, used by the run/message list) and a separate cleaner inline bubble inside `AgentTimeline`. Unify on the clean one — `UserMessage` is now a quiet right-aligned bordered bubble on the muted surface (no fill, no uppercase label), and `AgentTimeline` renders through it instead of its own copy. `UserMessage` accepts either session-model `parts` or a direct `content`/`timestamp`, so both call sites share it.

## 9.1.1

### Patch Changes

- a8d770e: Give run/timeline tool rows a proper elevation ladder. Rows read as the same value as the canvas: `InlineToolItem` used `bg-card/40` (near-transparent) and RunGroup's OpenUI/running blocks used `bg-[var(--bg-root)]` (literally the page background). Both now use `--md3-surface-container` — one clear step above the `--bg-root` canvas — with hover/open stepping to `--md3-surface-container-high`. Rows now separate from the background instead of blending into it.

## 9.1.0

### Minor Changes

- deb065a: AgentTimeline now accepts `renderToolActions` (and carries the source `ToolPart` on its tool items) so consumers can render actions beside a tool call — e.g. "open in artifacts". Previously these hooks reached only the run-grouped `MessageList`, not the timeline presentation. ChatContainer exposes this through a new `renderTimelineToolActions?(part)` prop; the existing `renderToolActions(part, options)` contract for the `runs` presentation is unchanged.

  The timeline tool-call summary now shows a human-readable detail (file path / command via `getToolDisplayMetadata`) instead of the raw input JSON, and drops the redundant `title: description` label. The source `ToolPart` is threaded into `ToolCallStep`, so the expanded detail renders the full input + output via `ExpandedToolDetail` (previously the timeline's expanded view showed only the output).

## 9.0.0

### Major Changes

- 87252cf: Flip the transcript convergence: RunGroup adopts AgentTimeline's look, not the reverse. 8.1 made AgentTimeline fold tool activity into RunGroup's single filled box (`AssistantRunShell`); that boxed all steps into one card and lost the timeline's separated, distinct rows. Reverted.

  - **`RunGroup`** now renders as separated steps on a timeline spine (connector line + accent dots, one row per tool/reasoning/text part) with a quiet collapsible header (chevron · label · summary · status) — no wrapping `bg-card` box, and consecutive tools are no longer joined into one block. It reads like `AgentTimeline`, plus collapse.
  - **`AgentTimeline`** is restored to its prior flat, separated rendering (no tool-run folding). The `collapsibleToolRuns` / `defaultToolRunsOpen` props added in 8.1 are removed.
  - **`AssistantRunShell`** (added in 8.1) is removed — the boxed shell is gone.

  BREAKING: `AssistantRunShell` / `AssistantRunShellProps` are no longer exported, and `AgentTimeline` drops the `collapsibleToolRuns` / `defaultToolRunsOpen` props.

## 8.1.0

### Minor Changes

- 79b55f5: Converge the two transcripts on one collapsible run. New `AssistantRunShell` primitive (the header · summary · status pill · chevron · Radix collapse extracted from `RunGroup`) is now used by both `RunGroup` and `AgentTimeline`, so there is one implementation of "an assistant run" instead of two divergent ones. `AgentTimeline` folds consecutive tool / tool-group items into that shell (`collapsibleToolRuns`, default on; `defaultToolRunsOpen`, default open) so a burst of tool activity reads as one toggleable step on the timeline spine instead of a long ladder of rows — matching `RunGroup`. Additive: `AgentTimeline`'s `items[]` API is unchanged and folding happens internally; consumers building their own item arrays keep working.

## 8.0.0

### Major Changes

- 831e935: One composer, no zombie API. `ChatInput` is deleted — the canonical composer is `AgentComposer` in `@tangle-network/sandbox-ui`, composed below the transcript by the app. `ChatContainer` is now transcript-only: the input props (`onSend`, `onCancel`, `placeholder`, `hideInput`, `modelLabel`, `onModelClick`, `pendingFiles`, `onRemoveFile`, `onAttach`, `disabled`) and the `PendingFile` type are removed. `ChatMessage` drops the no-op `avatar`/`hideAvatar` props. `ToolCallStep`/`ToolCallGroup` are no longer exported (internal adapters over `InlineToolItem`); the `ToolCallType`/`ToolCallStatus` types stay public via `ToolCallData`, and `ToolCallFeed` is unchanged.

## 7.0.0

### Minor Changes

- 46592b3: Calmer chat/run design + named multi-theme system.

  - `ChatMessage`/`RunGroup`: role labels move above the bubble (plain text-xs), avatar circles removed (`avatar`/`hideAvatar` are deprecated no-ops), `InlineToolItem` rows are taller with quiet inline failed/running text instead of uppercase pills. `ToolCallStep`/`ToolCallFeed` stories leave Storybook (source adapters remain).
  - `@tangle-network/brand` adds `themes.css`: `[data-theme]` scopes (`aubergine`, `aubergine-light`, `arena`, `arena-light`, `tangle-light`) that re-skin every component through the `@theme` semantic mappings, plus a `Foundations/Theme Showcase` story.

### Patch Changes

- Updated dependencies [46592b3]
  - @tangle-network/brand@0.8.0

## 6.0.0

### Patch Changes

- Updated dependencies [e199bc7]
  - @tangle-network/brand@0.7.0

## 5.2.0

### Minor Changes

- b0bf106: Single tool-call row implementation. `ToolCallStep` (the timeline/feed row used by `AgentTimeline` and `ToolCallFeed`) is now a thin adapter over the canonical `InlineToolItem` — it maps its flat `label`/`status`/`detail`/`output`/`duration` props onto a `ToolPart` and delegates rendering. The duplicate bespoke row markup is deleted, so every transcript (`RunGroup`, `AgentTimeline`, `ToolCallFeed`) shares one row component and one look. `InlineToolItem` gains optional `title`/`description` overrides for callers that supply explicit labels. No public API changes.

## 5.1.0

### Minor Changes

- 6db1ce3: Calmer, unified agent transcript. The tool-call rows read as harsh black-and-white outlines on dark surfaces; soften the whole transcript to one calm design language:

  - `ToolCallStep` (used by `AgentTimeline`): subtle `--border-subtle` row border instead of full-strength `border-border`, a borderless tinted status badge, and a quiet status glyph (green check / red alert) in place of the loud bordered uppercase `SUCCESS`/`ERROR` pill.
  - `InlineToolItem` (used by `RunGroup`): same subtle border, and a blueprint-style accent left-border indent on the expanded detail so expanding reads cleanly.

  No API or capability changes — purely the visual treatment, applied consistently so `RunGroup` and `AgentTimeline` share one calm look.

## 5.0.0

### Patch Changes

- Updated dependencies [c56ea6c]
  - @tangle-network/brand@0.6.0

## 4.1.0

### Minor Changes

- d7a442d: Share theme-aware file-format rendering across the preview and artifact surfaces. `FilePreview` now routes `code`/`json`/`yaml` through the same theme-aware `CodeBlock` the chat markdown renderer uses, so code is syntax-highlighted and theme-consistent in the artifact pane instead of monochrome. A new `files/file-format` module (`detectFileFormat`, `getFormatLabel`, `getSyntaxLanguage`, `fileExtension`) is the single source of truth for extension/MIME detection, consumed by `FilePreview`, `FileArtifactPane`, and `WriteFilePreview`. `CodeBlock` gains an optional `label` prop to display a header name independent of the highlight language.

## 4.0.0

### Patch Changes

- Updated dependencies [184c8bb]
  - @tangle-network/brand@0.5.0

## 3.0.0

### Patch Changes

- Updated dependencies [8152d92]
  - @tangle-network/brand@0.4.0

## 2.1.0

### Minor Changes

- 12f5565: Add `<RedactedDocument>` viewer (`@tangle-network/ui/redaction`): renders a server-produced redacted document with masked, click-to-reveal spans. The client holds only `{ id, kind }` per span; revealing one round-trips through an `onReveal` callback so authorization and the audit trail stay server-side (pairs with `@tangle-network/agent-app/redact`'s `buildRedactedDocument` / `revealSpan`).

## 2.0.0

### Major Changes

- 4d7cc77: Drop `editor` re-exports from `@tangle-network/ui` root barrel. The `@tangle-network/ui/editor` subpath is unchanged.

  **Rationale:** the editor surface drags `@tiptap/*`, `yjs`, and `@hocuspocus/provider` type chains into the package root's `.d.ts`. These are specialized collaboration tooling, not generic UI primitives — they should not appear in a consumer's default import.

  **Migration:**

  ```ts
  // before
  import {
    TiptapEditor,
    EditorToolbar,
    DocumentEditorPane,
  } from "@tangle-network/ui";

  // after
  import {
    TiptapEditor,
    EditorToolbar,
    DocumentEditorPane,
  } from "@tangle-network/ui/editor";
  ```

  `sed` recipe:

  ```bash
  grep -rl '"@tangle-network/ui"' src/ \
    | xargs sed -i '' -E '/Tiptap|Editor|Collaborat|useYjs|useAwareness|DocumentEditor|ConnectionState/s|"@tangle-network/ui"|"@tangle-network/ui/editor"|g'
  ```

  **Known residual:** `dist/index.d.ts` still emits type-only side-effect imports for `@hocuspocus/provider` and `yjs`. These come from `FileArtifactPaneEditorOptions` in `files/file-artifact-pane.tsx`, which types its optional collaboration config against `DocumentEditorMode`/`DocumentEditorBackend`/`DocumentEditorPaneCollaborationConfig` from `editor/`. The actual editor symbols (`TiptapEditor`, `EditorProvider`, etc.) and `@tiptap/*` types are no longer at the root. A follow-up PR can either extract the editor option types out of `editor/` or drop `./files` from the root barrel; both exceed this PR's scope.

## 1.0.1

### Patch Changes

- 0db7afc: Expose `ThemeToggle` and `useTheme` from `@tangle-network/ui/primitives`. The component and hook were bulk-imported in `1.0.0` but never wired into `primitives/index.ts`, leaving them inaccessible to consumers.

## 1.0.0

### Minor Changes

- b72f91d: Initial public release. 14 subpath exports: `primitives`, `chat`, `run`, `openui`, `files`, `editor`, `markdown`, `auth`, `hooks`, `sdk-hooks`, `stores`, `types`, `utils`, `tool-previews`. Bulk-imported from `@tangle-network/sandbox-ui`. Logo re-exported from `@tangle-network/brand`. `InlineCode` and themed `CodeBlock`/`CopyButton` exposed on the primitives subpath. Tailwind v4-native; no CSS shipped — consumers re-import `@tangle-network/brand/styles`.

### Patch Changes

- Updated dependencies [2330781]
  - @tangle-network/brand@0.3.0
