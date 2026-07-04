# @tangle-network/ui

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
