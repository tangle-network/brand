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

## Styling

This package ships no CSS. Its components are Tailwind v4 class names in source, and the build emits JavaScript only, so two pieces of consumer setup carry real weight.

### Scan this package

Your Tailwind or UnoCSS build has to read this package's files. Neither scans `node_modules` on its own, so a class that only this package names is never generated. Nothing fails loudly when one is missing: the element still renders, still occupies space and still takes clicks, it just looks inert. A `Switch` with no track colour in either state, a `Tabs` where the selected tab is indistinguishable from the rest, and a `Textarea` collapsed to one row all come out of this.

Tailwind v4, in the stylesheet that imports `tailwindcss`. `@source` paths resolve relative to that stylesheet, so adjust the prefix to wherever yours lives:

```css
/* from src/styles/app.css, with node_modules two levels up */
@source "../../node_modules/@tangle-network/ui/src/**/*.tsx";
@source "../../node_modules/@tangle-network/ui/src/**/*.ts";
```

`sandbox-ui` runs exactly these two globs in `src/styles/globals.css`, alongside `@import "tailwindcss" source(none)` so the scan is the whole of what the bundle compiles from.

UnoCSS, in `uno.config.ts`:

```ts
content: {
  filesystem: ["node_modules/@tangle-network/ui/dist/**/*.js"],
}
```

Under pnpm that plain glob can match zero files. `node_modules/@tangle-network/ui` is a symlink into `node_modules/.pnpm`, and UnoCSS's globber does not follow it, which leaves you exactly where you started with no error. Pre-expand the glob with something that does follow symlinks, resolve each hit through `realpath`, and hand UnoCSS concrete paths. `tangle-network/blueprint-agent`'s `apps/web/uno.config.ts` carries a worked version that walks the import graph of the two entries it uses rather than the whole `dist`.

Two things to check after wiring this up, because the failure is silent either way. Read the generated CSS for a class this package alone names, rather than eyeballing the app. And assert the scan resolved a non-zero number of files: a scan that silently matches nothing looks identical to no scan at all.

One consequence worth knowing. This is a scan, not a manifest, so a consumer emits only the classes the version it installed actually names. Upgrading this package can introduce a class your build has never generated, and it will go missing the same silent way.

### Import the brand stylesheet

`@tangle-network/brand` is a peer dependency. It holds the tokens every colour here resolves through, and a few real classes that some components reference by name instead of composing out of utilities. `Badge` with `dot` is the one to know about: it emits `status-dot status-dot-running` and its siblings, which are defined in `@tangle-network/brand/styles/globals.css` and nowhere else. Without that import the dots have no size and no colour.

```css
@import "@tangle-network/brand/styles";
@import "tailwindcss";
```

See [`@tangle-network/brand`'s README](../brand/README.md) for the token-level breakdown, the finer-grained imports, and the fonts, which brand deliberately does not bundle.

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
