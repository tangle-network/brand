#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
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

// `editor-peers.ts` classifies a resolution failure by the same list. A peer
// in one list and not the other reads as a missing peer for the build and as
// an unrelated failure at run time, which is how `@tiptap/core` slipped
// through once. Read the source list and require the two to agree.
const peersSourcePath = join(packageDirectory, "src", "editor", "editor-peers.ts");
const peersSource = readFileSync(peersSourcePath, "utf8");
const deferredPeersLiteral = peersSource.match(/const DEFERRED_PEERS = \[([^\]]*)\]/);
if (deferredPeersLiteral === null) {
  console.error(
    `validate-dist: no DEFERRED_PEERS array found in ${relative(root, peersSourcePath)}`,
  );
  process.exit(1);
}
const runtimeDeferredPeers = [...deferredPeersLiteral[1].matchAll(/["']([^"']+)["']/g)].map(
  (match) => match[1],
);
const runtimeOnly = runtimeDeferredPeers.filter((name) => !deferredOptionalPeers.includes(name));
const scriptOnly = deferredOptionalPeers.filter((name) => !runtimeDeferredPeers.includes(name));
if (runtimeOnly.length > 0 || scriptOnly.length > 0) {
  console.error("validate-dist: DEFERRED_PEERS does not match this script's deferred list:");
  for (const name of runtimeOnly) console.error(`  ${name}: in editor-peers.ts only`);
  for (const name of scriptOnly) console.error(`  ${name}: in this script only`);
  process.exit(1);
}

function specifierPattern(peer) {
  return `${peer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:/[^"']*)?`;
}

// `from "x"` also matches a re-export and an import statement that spans
// lines; `import("x")` is the dynamic form and is the point of the rule.
function staticImportPattern(peer) {
  return new RegExp(`(?:^|[^\\w$.])(?:from|import)\\s*["']${specifierPattern(peer)}["']`);
}

// esbuild reports an unresolvable literal `import()` as a build error and
// leaves it to run time only when the call carries a `.catch()`. A dynamic
// import that loses its handler still builds here and under Vite, and breaks
// an esbuild consumer that installs no peers.
//
// The handler may sit behind other links in the chain — `.then(fn).catch(fn)`
// satisfies esbuild too — so the chain is walked rather than matched. A regex
// cannot decide this: a handler such as `.then((m) => m)` carries its own
// parentheses.
function skipString(code, quoteIndex) {
  const quote = code[quoteIndex];
  for (let index = quoteIndex + 1; index < code.length; index += 1) {
    if (code[index] === "\\") {
      index += 1;
      continue;
    }
    if (code[index] === quote) return index;
  }
  return -1;
}

/** Index just past the `)` that closes the `(` at `openIndex`, or -1. */
function skipArgumentList(code, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < code.length; index += 1) {
    const character = code[index];
    if (character === '"' || character === "'" || character === "`") {
      index = skipString(code, index);
      if (index === -1) return -1;
      continue;
    }
    if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

/** True when the method chain starting at `start` reaches a `.catch`. */
function chainReachesCatch(code, start) {
  let index = start;
  const skipSpace = () => {
    while (index < code.length && /\s/.test(code[index])) index += 1;
  };
  for (;;) {
    skipSpace();
    if (code[index] !== ".") return false;
    index += 1;
    skipSpace();
    const nameStart = index;
    while (index < code.length && /[\w$]/.test(code[index])) index += 1;
    const member = code.slice(nameStart, index);
    skipSpace();
    // A bare `.catch` that nothing calls installs no handler, so read the
    // argument list before the link counts.
    if (code[index] !== "(") return false;
    index = skipArgumentList(code, index);
    if (index === -1) return false;
    if (member === "catch") return true;
  }
}

function hasUncaughtDynamicImport(code, peer) {
  const call = new RegExp(`import\\s*\\(\\s*["']${specifierPattern(peer)}["']\\s*\\)`, "g");
  for (let match = call.exec(code); match !== null; match = call.exec(code)) {
    if (!chainReachesCatch(code, match.index + match[0].length)) return true;
  }
  return false;
}

// Code-split chunks and nested directories carry imports too, so read every
// emitted file rather than the top level alone.
const emittedFiles = readdirSync(distDirectory, {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .map((entry) => join(entry.parentPath, entry.name));

const staticPeerImports = [];
const uncaughtPeerImports = [];
for (const file of emittedFiles) {
  const code = readFileSync(file, "utf8");
  const label = relative(distDirectory, file);
  for (const peer of deferredOptionalPeers) {
    if (staticImportPattern(peer).test(code)) {
      staticPeerImports.push(`${label}: ${peer}`);
    }
    if (hasUncaughtDynamicImport(code, peer)) {
      uncaughtPeerImports.push(`${label}: ${peer}`);
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
if (uncaughtPeerImports.length > 0) {
  console.error(
    "validate-dist: every dynamic import of a deferred optional peer must carry a .catch(), " +
      "or an esbuild consumer without the peer fails to build:",
  );
  for (const entry of uncaughtPeerImports) console.error(`  ${entry}`);
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
    `dynamic-only and caught, no CSS leak, ${emittedFiles.length} files scanned)`,
);
