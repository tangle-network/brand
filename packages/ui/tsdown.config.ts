import { existsSync } from "node:fs";
import manifest from "./package.json" with { type: "json" };
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: Object.fromEntries(Object.entries(manifest.exports).flatMap(([name, target]) => {
    if (typeof target === "string") return [];
    const key = name === "." ? "index" : name.slice(2);
    const path = key === "openui-schema" ? "openui/schema" : key;
    const source = [`src/${path}.ts`, `src/${path}.tsx`, `src/${path}/index.ts`, `src/${path}/index.tsx`].find(existsSync);
    if (!source) throw new Error(`No source for public module ${name}`);
    return [[key, source]];
  })),
  // Keep component modules independently removable by consumers. In particular,
  // the existing primitives -> markdown CodeBlock re-export must not co-locate
  // syntax-highlighter initialization with Button/Input/Card in a shared chunk.
  // The package export map owns the module list for every build layout.
  unbundle: true,
  root: "src",
  platform: "neutral",
  dts: true,
  clean: true,
  // Consumers continue to own their client boundaries.
  checks: { moduleLevelDirective: false },
});
