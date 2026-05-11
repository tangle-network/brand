---
"@tangle-network/ui": major
---

Drop `editor` re-exports from `@tangle-network/ui` root barrel. The `@tangle-network/ui/editor` subpath is unchanged.

**Rationale:** the editor surface drags `@tiptap/*`, `yjs`, and `@hocuspocus/provider` type chains into the package root's `.d.ts`. These are specialized collaboration tooling, not generic UI primitives — they should not appear in a consumer's default import.

**Migration:**

```ts
// before
import { TiptapEditor, EditorToolbar, DocumentEditorPane } from "@tangle-network/ui";

// after
import { TiptapEditor, EditorToolbar, DocumentEditorPane } from "@tangle-network/ui/editor";
```

`sed` recipe:

```bash
grep -rl '"@tangle-network/ui"' src/ \
  | xargs sed -i '' -E '/Tiptap|Editor|Collaborat|useYjs|useAwareness|DocumentEditor|ConnectionState/s|"@tangle-network/ui"|"@tangle-network/ui/editor"|g'
```

**Known residual:** `dist/index.d.ts` still emits type-only side-effect imports for `@hocuspocus/provider` and `yjs`. These come from `FileArtifactPaneEditorOptions` in `files/file-artifact-pane.tsx`, which types its optional collaboration config against `DocumentEditorMode`/`DocumentEditorBackend`/`DocumentEditorPaneCollaborationConfig` from `editor/`. The actual editor symbols (`TiptapEditor`, `EditorProvider`, etc.) and `@tiptap/*` types are no longer at the root. A follow-up PR can either extract the editor option types out of `editor/` or drop `./files` from the root barrel; both exceed this PR's scope.
