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

All four entries are built under identical production options, entry and output paths within each toolchain.
Vite/Rolldown, the maintained application toolchain, supplies the primary consumer gate.
Separate esbuild builds retain a diagnostic for all four entries and a `/primitives` isolation gate. React is bundled, not externalized. Raw, gzip level 9, and
Brotli quality 11 bytes are summed separately for all compiler artifacts and all
entry-reachable resources, including static and lazy chunks.
The orphan counter retains every output unreachable from the fixture entry.
esbuild can emit dynamic-import entrypoints from modules eliminated by tree shaking; these orphan artifacts are not entry load cost. These are fixture JavaScript transfer sizes, not measured
Platform downloads, route timings, CSS/font totals, or first-load-only costs.

`report.json` records tool versions, source revision, lockfile and tarball hashes,
options, bytes, emitted modules, and forbidden modules. Eight `*.metafile.json` files retain esbuild scanned and emitted dependency graphs.
Eight `*.vite-graph.json` files retain Vite emitted modules and import edges. Reports default to
`node_modules/.cache/ui-imports`, outside the smoke script's temporary directory.
`UI_IMPORTS_REPORT` also retains the complete emitted graphs in the CI job log;
the job summary shows the compressed-byte table. No fixed savings are assumed:
the baseline may already remove some code. Its measured values are reported as-is.

## Gates

The Vite root and `/primitives` consumers must retain Button, Input and Card.
They must exclude syntax-highlighting, editor, OpenUI, unrelated UI domains, and Tangle agent/runtime modules, including through lazy chunks.
The esbuild `/primitives` consumer must pass the same isolation gate.

**Known diagnostic failure:** esbuild splitting retains highlighter code through shared dynamic-entry chunks at the root.
Its `light=false` result, forbidden module list, reachable bytes, and all emitted bytes remain in the report and CI summary.
Vite removes this code from the same packed root consumer.
This fixture does not claim universal root isolation across bundlers.
The initial esbuild all-artifact isolation gate failed because it also counted unreachable compiler outputs.
The revised checker retains those artifacts in a separate counter and budget; it does not erase the initial failure.
The separate emission budget requires all generated light-consumer artifacts to remain no larger than the same-source bundled baseline.
Orphan bytes and complete emitted module lists remain in the report; they are not hidden from the budget. Externalizing code cannot pass.
The checker distinguishes modules a bundler visited from modules that contributed
output bytes. Its Node tests reject heavy code behind static, lazy, shared, and cyclic edges.
They also reject missing, ambiguous, and partial output graphs without third-party dependencies.

Markdown must positively retain the highlighter, and the editor must positively
retain its Tiptap peers. A separate packed-consumer runtime bundle verifies
primitive server rendering, highlighted markdown rendering, strict identity of
the legacy CodeBlock/CopyButton exports, and a JSDOM local editor mount followed
by controlled content/read-only updates. React is externalized **only in this separate runtime test** to share the renderer instance.
This runtime bundle resolves packed ESM modules using `module` before `main`, matching the browser dependency graph.
Node/esbuild main-only resolution of the legacy highlighter CJS entry fails default-export interop; that path is not covered by this ESM runtime proof. JSDOM is the repository's
existing test dependency, not a new UI dependency. This does not test remote
collaboration, clipboard permissions, or real-browser layout.

The package's normal build still runs declaration generation, `validate-dist`
and the OpenUI worker probe; the existing all-entry/optional-peer matrix remains.
Platform's `TANGLE_UI_DIST` seam remains available for a separate application
check. Nothing here introduces another seam or claims Platform was exercised.

## Verification on the supported toolchain

On GTR, Node 24.20.0, pnpm 12.6.0, tsdown 0.23.0, esbuild 0.28.2, and Vite 8.3.1 were exercised.
The layout comparison used identical source, packed manifests, and npm dependency locks.
Vite root JavaScript measured 70,385 gzip bytes before and 30,526 after.
Esbuild root remained heavy at 441,162 reachable gzip bytes after; its diagnostic is intentionally retained.
A built Vite consumer loaded one 261,329-byte JavaScript resource and 109,396 bytes of CSS over uncompressed local HTTP.
That browser application includes ReactDOM and app code, so its bytes differ from the library fixture.
Three cold isolated Chromium contexts and three warm reloads verified input editing and button state with zero page errors.
These are packed-consumer measurements, not production Platform latency or deployment proof.
Complete graphs, original failed logs, tarball identities, browser network receipts, and the screenshot accompany the PR.

## Original authoring limitations

The following records the Pro author's initial checks before the supported-toolchain verification above.


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
[esbuild metafiles](https://esbuild.github.io/api/#metafile) and
[esbuild chunk architecture](https://github.com/evanw/esbuild/blob/main/docs/architecture.md).
