import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";
import { build } from "esbuild";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(packageRoot, "src/openui/schema-data.ts");
const outputPath = resolve(packageRoot, "src/openui/schema-compiled.ts");
const { outputFiles } = await build({
  entryPoints: [sourcePath],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const sourceUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString("base64")}`;
const { OPENUI_NODE_TYPES, OPENUI_NODE_JSON_SCHEMA } = await import(sourceUrl);
const ajv = new Ajv({ allowUnionTypes: true, code: { source: true, esm: true } });
const exports = {};
for (const type of OPENUI_NODE_TYPES) {
  const id = `https://tangle.tools/openui/${type}`;
  ajv.addSchema({ $id: id, $ref: `#/$defs/${type}`, $defs: OPENUI_NODE_JSON_SCHEMA.$defs });
  exports[type] = id;
}
const content = [
  "// Generated from schema-data.ts. Run `pnpm gen:openui-schema` after schema changes.",
  "// @ts-nocheck",
  standaloneCode(ajv, exports),
  "",
].join("\n");

if (process.argv.includes("--check")) {
  const existing = await readFile(outputPath, "utf8").catch(() => "");
  if (existing !== content) {
    throw new Error("OpenUI validators are stale; run `pnpm gen:openui-schema` in packages/ui.");
  }
} else {
  await writeFile(outputPath, content);
}
