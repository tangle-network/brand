#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const distDir = join(root, "packages", "ui", "dist");

const expected = [
  "index",
  "primitives",
  "chat",
  "run",
  "openui",
  "files",
  "editor",
  "markdown",
  "auth",
  "hooks",
  "sdk-hooks",
  "stores",
  "types",
  "utils",
  "tool-previews",
];

const missing = [];
for (const name of expected) {
  for (const ext of [".js", ".d.ts"]) {
    const p = join(distDir, name + ext);
    if (!existsSync(p)) missing.push(p);
  }
}

if (missing.length) {
  console.error("validate-dist: missing files:");
  for (const p of missing) console.error("  " + p);
  process.exit(1);
}

const cssShouldNotExist = ["tokens.css", "globals.css", "styles.css"];
const leaked = cssShouldNotExist.filter((f) => existsSync(join(distDir, f)));
if (leaked.length) {
  console.error("validate-dist: ui must not ship CSS, found:");
  for (const f of leaked) console.error("  " + f);
  process.exit(1);
}

console.log(`validate-dist: ok (${expected.length} subpaths × 2 = ${expected.length * 2} files; no CSS leak)`);
