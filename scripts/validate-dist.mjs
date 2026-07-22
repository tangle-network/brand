#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
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
const forbiddenCss = ["tokens.css", "globals.css", "styles.css"].filter((name) =>
  existsSync(join(distDirectory, name)),
);
if (forbiddenCss.length > 0) {
  console.error("validate-dist: ui must not ship CSS:");
  for (const name of forbiddenCss) console.error(`  ${name}`);
  process.exit(1);
}

console.log(
  `validate-dist: ok (${Object.keys(manifest.exports).length} exports, ${targetCount} files, ${Object.keys(manifest.peerDependenciesMeta ?? {}).length} optional peers, no CSS leak)`,
);
