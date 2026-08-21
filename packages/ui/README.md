# @tangle-network/ui

Generic React UI components for Tangle products. Imports tokens from `@tangle-network/brand` (peer dep). Tailwind v4-native.

Component visual precedent is governed by the repo-level [brand guidelines](../../docs/brand-guidelines.md) and [component audit](../../docs/component-audit.md). Storybook examples are test surfaces; they are not automatically approved brand patterns.

## Install

```sh
pnpm add @tangle-network/ui @tangle-network/brand react react-dom
```

## Use

```tsx
import { Button } from "@tangle-network/ui/primitives";
import { Logo } from "@tangle-network/brand";

export function App() {
  return (
    <>
      <Logo size="md" />
      <Button>Click</Button>
    </>
  );
}
```

## Subpaths

Sixteen named exports: `primitives`, `chat`, `run`, `openui`, `files`, `editor`, `markdown`, `auth`, `hooks`, `sdk-hooks`, `stores`, `types`, `utils`, `tool-previews`, `nav`, `redaction`.

## Optional peers

`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-caret`, `@hocuspocus/provider` and `yjs` back the `./editor` entry. The entry reaches every one of them through a dynamic `import()`, and gets a loud error that names the missing packages only when it renders an editor. `./editor` splits the cost three ways, so each surface costs only the peers it uses:

| Surface | Peers it needs |
| --- | --- |
| `DocumentEditorPane` in preview mode | none |
| `MarkdownDocumentEditor` (local) | `@tiptap/react`, `@tiptap/starter-kit` |
| `EditorProvider` (collaboration transport) | `@hocuspocus/provider`, `yjs` |
| `TiptapEditor` (collaborative) | all of the above, plus both collaboration extensions |

`EditorProvider` builds the document and the socket from `yjs` and `@hocuspocus/provider` alone, so a consumer that drives its own editor from its context — through `useEditorConnection`, `useCollaborators` and the other `./editor` hooks — installs those two and no tiptap package.

A bundler still reads the literal specifier in a dynamic `import()`, so what a consumer without the peers must do depends on the bundler:

| Bundler | A consumer that installs none of the peers |
| --- | --- |
| Vite, Rollup | Builds. The unresolved peer becomes a chunk that throws when it loads. |
| esbuild | Builds. Each import carries a `.catch()`, which moves the unresolved path from build time to run time. |
| webpack | Needs configuration. Give `resolve.fallback` the value `false` for each peer you do not install, for example `resolve: { fallback: { "@tiptap/react": false } }`. |

A TypeScript consumer resolves these entries through the emitted declarations, and those declarations name the optional peers in their own import statements. Keep `skipLibCheck: true` — the common default — and a consumer without the peers type-checks: its own imports resolve, and TypeScript skips the declaration files that name the packages it does not have. With `skipLibCheck: false`, TypeScript reads those files and reports `TS2307` for each absent peer; install the peers, or add a module declaration for each one you omit.

`pnpm test:package` builds a packed consumer that installs none of the peers, under both Vite and esbuild, and type-checks it. `scripts/validate-dist.mjs` rejects a static import of any of them, and rejects a dynamic import that lost its `.catch()`.

Because the peers now resolve at first render rather than at build time, a missing one surfaces as a thrown error while React renders. Wrap the editors in an error boundary, so the install list reaches a surface you control instead of unmounting the tree.

`nanostores` and `@nanostores/react` back `./stores`, and `react-router` backs `./nav`. Those two entries create their values at module scope, so they hold a static import and a consumer that imports them must install the peer. Every other entry stays free of all of these.
