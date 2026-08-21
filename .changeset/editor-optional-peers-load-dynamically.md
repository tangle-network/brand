---
"@tangle-network/ui": minor
---

Load the `./editor` entry's optional peers through a dynamic `import()`.

The entry declares `@tiptap/*`, `@hocuspocus/provider` and `yjs` as optional peers, but reached them through static imports. A bundler resolves an uninstalled optional peer to a stub module that carries a default export only, so `import { EditorContent } from "@tiptap/react"` and `import { HocuspocusProvider } from "@hocuspocus/provider"` failed the build of every consumer that did not install them, with `MISSING_EXPORT`. The failure was not limited to `./editor`: `./files` reaches `DocumentEditorPane` through a lazy import, so `@tangle-network/ui/files` failed the same way.

`EditorProvider`, `TiptapEditor` and the local markdown editor are now built from namespaces that `loadCollaborationPeers`/`loadDocumentEditorPeers` resolve at first render. A consumer without the peers builds clean and sees an error that names the packages to install, and only when it renders an editor. Preview-only use of `DocumentEditorPane` needs no peer at all. The two loaders stay separate so the local markdown editor still runs on `@tiptap/react` and `@tiptap/starter-kit` alone, without yjs or Hocuspocus.

Rendering an editor now goes through a `Suspense` boundary: `TiptapEditor` and the local editor show a "Loading editor…" placeholder for the first frame, and `EditorProvider` renders its children only after the peers land, because every child hook reads a context that only the loaded provider supplies.
