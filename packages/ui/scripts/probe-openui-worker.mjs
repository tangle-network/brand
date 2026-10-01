import assert from "node:assert/strict";

// Old Cloudflare Workers disallow Function at module startup. Import the built
// public subpath under that constraint, then exercise both validator outcomes.
const originalFunction = globalThis.Function;
globalThis.Function = function () {
  throw new Error("Dynamic Function is unavailable in this Worker");
};
try {
  const { validateOpenUIJsonNode } = await import("../dist/openui-schema.js");
  assert.equal(validateOpenUIJsonNode({ type: "card", title: "Ready" }).ok, true);
  const rejected = validateOpenUIJsonNode({ type: "card", children: [{ type: "section" }] });
  assert.deepEqual(rejected, {
    ok: false,
    issue: { path: "$.children[0]", message: "Unsupported OpenUI node type: section." },
  });
} finally {
  globalThis.Function = originalFunction;
}
console.log("openui-schema: Worker startup without dynamic Function passed");
