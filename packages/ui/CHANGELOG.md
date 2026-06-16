# @tangle-network/ui

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
