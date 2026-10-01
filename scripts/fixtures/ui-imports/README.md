# Packed UI import boundaries

This is a regression fixture for the existing UI entrypoints, not another UI
package or a new consumer integration mechanism. `tsdown` keeps modules separate;
the package's existing `sideEffects: false` contract allows unused modules to be
removed. The export map, declarations' public paths, peer dependencies and legacy
`/primitives` CodeBlock/CopyButton exports remain unchanged. More subpath names
alone are not evidence of smaller output. No Radix component is replaced.

## Run

Use the repository's declared Node and pnpm versions, then from its root:

```sh
pnpm install --frozen-lockfile
pnpm build
node --test scripts/fixtures/ui-imports/graph.test.mjs
UI_IMPORTS_REPORT_DIR="$PWD/node_modules/.cache/ui-imports" \
  node scripts/package-smoke.mjs packages/ui
pnpm test:package
```

The default UI smoke run invokes this fixture after its existing Vite, esbuild
and TypeScript checks across all public exports. Alternate-peer, omitted-peer,
and externally supplied `PACKAGE_TARBALL` runs retain their existing behavior;
they do not run this same-source comparison. This adds no dependency or workflow.

## What is measured

The existing smoke script installs a real `pnpm pack` tarball into a clean npm
consumer, including its required workspace peer tarballs and optional peers.
Four browser entries import Button/Input/Card from `/primitives` or the root,
markdown (including the legacy identity check), and the local document editor
from `/editor`. No aliases, workspace source imports, manual vendor chunks,
externalized dependencies, or source-graph-only byte claims are used.

The comparison builds the previous **bundled layout from the same current
source**, using the same tsdown configuration with only `unbundle: false` and a
temporary `outDir` override. It creates a baseline tgz from the original packed
package, replacing only `dist`. It is not represented as a historical npm release
or an old source checkout. Each tarball is extracted at the exact npm dependency
path in turn; the original tarball is restored in a `finally` block. The consumer
installation and lockfile are not re-resolved. This isolates the layout change
from dependency-version changes and retains the actual packed dependency path.

All four entries are built under identical production esbuild options, entry
and output paths. React is bundled, not externalized. Raw, gzip level 9, and
Brotli quality 11 bytes are summed per resource across **all** emitted chunks,
including lazy chunks. These are fixture JavaScript transfer sizes, not measured
Platform downloads, route timings, CSS/font totals, or first-load-only costs.

`report.json` records tool versions, source revision, lockfile and tarball hashes,
options, bytes, emitted modules, and forbidden modules. Eight `*.metafile.json`
files retain both scanned and emitted dependency graphs. Reports default to
`node_modules/.cache/ui-imports`, outside the smoke script's temporary directory.
`UI_IMPORTS_REPORT` also retains the complete emitted graphs in the CI job log;
the job summary shows the compressed-byte table. No fixed savings are assumed:
the baseline may already remove some code. Its measured values are reported as-is.

## Gates

The light consumers must actually retain Button, Input and Card and must not
emit syntax-highlighting, editor, OpenUI, unrelated UI domains, or Tangle
agent/runtime modules, including in lazy chunks. Externalizing code cannot pass.
The checker distinguishes modules a bundler visited from modules that contributed
output bytes. Its Node tests exercise false-green cases without third-party deps.

Markdown must positively retain the highlighter, and the editor must positively
retain its Tiptap peers. A separate packed-consumer runtime bundle verifies
primitive server rendering, highlighted markdown rendering, strict identity of
the legacy CodeBlock/CopyButton exports, and a JSDOM local editor mount followed
by controlled content/read-only updates. React is externalized **only in this
separate runtime test** to share the renderer instance. JSDOM is the repository's
existing test dependency, not a new UI dependency. This does not test remote
collaboration, clipboard permissions, or real-browser layout.

The package's normal build still runs declaration generation, `validate-dist`
and the OpenUI worker probe; the existing all-entry/optional-peer matrix remains.
Platform's `TANGLE_UI_DIST` seam remains available for a separate application
check. Nothing here introduces another seam or claims Platform was exercised.

## Evidence status at authoring

Locally executed on Node 22.16.0: seven checker tests passed; all new `.mjs`
files and the modified smoke script passed `node --check`. That Node is below
the repository's declared minimum, so this is not a supported-toolchain build.
Repository checkout failed with `Could not resolve host: github.com`; offline
`npm exec --offline --yes --package=tsdown -- tsdown --version` failed with
`ENOTCACHED`. Invoking the smoke script locally failed before any build with
`ERR_MODULE_NOT_FOUND` for `esbuild`. No packed build, runtime pass, actual compressed-byte result,
production improvement, or Platform proof is claimed from those local checks.
The commands above produce the missing evidence; CI observations belong in the PR.

References: [tsdown unbundle mode](https://tsdown.dev/options/unbundle) and
[esbuild metafiles](https://esbuild.github.io/api/#metafile).
