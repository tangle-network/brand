#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageDirectory = join(root, "packages", "ui");
const manifest = JSON.parse(readFileSync(join(packageDirectory, "package.json"), "utf8"));

function exportTargets(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(exportTargets);
}

const missing = [];
let targetCount = 0;
for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
  const targets = exportTargets(value);
  if (targets.length === 0) {
    missing.push(`${subpath}: no file target`);
    continue;
  }
  for (const target of targets) {
    targetCount += 1;
    if (!existsSync(resolve(packageDirectory, target))) {
      missing.push(`${subpath}: ${target}`);
    }
  }
}

if (missing.length > 0) {
  console.error("validate-dist: missing exported files:");
  for (const entry of missing) console.error(`  ${entry}`);
  process.exit(1);
}

const invalidOptionalPeers = Object.keys(manifest.peerDependenciesMeta ?? {}).filter(
  (name) => !manifest.peerDependencies?.[name],
);
if (invalidOptionalPeers.length > 0) {
  console.error("validate-dist: peerDependenciesMeta entries must also be peerDependencies:");
  for (const name of invalidOptionalPeers) console.error(`  ${name}`);
  process.exit(1);
}

const distDirectory = join(packageDirectory, "dist");

// An uninstalled optional peer resolves to a bundler stub that carries a
// default export only and throws when it evaluates. One static import of such
// a peer therefore fails the build of every consumer that does not install
// it, which is the opposite of what `peerDependenciesMeta.optional` promises.
// A peer listed here must be reached only through a dynamic `import()`.
const deferredOptionalPeers = [
  "@hocuspocus/provider",
  "@tiptap/core",
  "@tiptap/extension-collaboration",
  "@tiptap/extension-collaboration-caret",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "yjs",
];

// Optional peers whose entry cannot run without them: `./stores` creates its
// atoms at module scope, and `./nav` re-exports react-router components. Both
// entries hold a static import, so a consumer that imports them must install
// the peer. Only their own entries carry that cost, because the package
// splits one file per export.
const eagerOptionalPeers = ["@nanostores/react", "nanostores", "react-router"];

const declaredOptionalPeers = Object.entries(manifest.peerDependenciesMeta ?? {})
  .filter(([, metadata]) => metadata?.optional === true)
  .map(([name]) => name);
const classifiedPeers = new Set([...deferredOptionalPeers, ...eagerOptionalPeers]);
// Every optional peer must be classified, so that a new one forces the choice
// between a dynamic import and an entry that requires it.
const unclassifiedPeers = declaredOptionalPeers.filter((name) => !classifiedPeers.has(name));
const staleClassifications = [...classifiedPeers].filter(
  (name) => !declaredOptionalPeers.includes(name),
);
if (unclassifiedPeers.length > 0 || staleClassifications.length > 0) {
  console.error("validate-dist: optional peer classification does not match the manifest:");
  for (const name of unclassifiedPeers) {
    console.error(`  ${name}: optional peer is in neither list in this script`);
  }
  for (const name of staleClassifications) {
    console.error(`  ${name}: listed in this script but not an optional peer`);
  }
  process.exit(1);
}

// `from "x"` also matches a re-export and an import statement that spans
// lines; `import("x")` is the dynamic form and is the point of the rule.
function staticImportPattern(peer) {
  const specifier = `${peer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:/[^"']*)?`;
  return new RegExp(`(?:^|[^\\w$.])(?:from|import)\\s*["']${specifier}["']`);
}

const staticPeerImports = [];
for (const file of readdirSync(distDirectory).filter((name) => name.endsWith(".js"))) {
  const code = readFileSync(join(distDirectory, file), "utf8");
  for (const peer of deferredOptionalPeers) {
    if (staticImportPattern(peer).test(code)) {
      staticPeerImports.push(`${file}: ${peer}`);
    }
  }
}
if (staticPeerImports.length > 0) {
  console.error(
    "validate-dist: deferred optional peers must be reached through a dynamic import():",
  );
  for (const entry of staticPeerImports) console.error(`  ${entry}`);
  process.exit(1);
}

const forbiddenCss = ["tokens.css", "globals.css", "styles.css"].filter((name) =>
  existsSync(join(distDirectory, name)),
);
if (forbiddenCss.length > 0) {
  console.error("validate-dist: ui must not ship CSS:");
  for (const name of forbiddenCss) console.error(`  ${name}`);
  process.exit(1);
}

console.log(
  `validate-dist: ok (${Object.keys(manifest.exports).length} exports, ${targetCount} files, ` +
    `${declaredOptionalPeers.length} optional peers, ${deferredOptionalPeers.length} of them ` +
    `dynamic-only, no CSS leak)`,
);
