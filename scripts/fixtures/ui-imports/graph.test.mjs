import assert from "node:assert/strict";
import test from "node:test";
import { assertLightGraph, compressedBytes, emittedGraph, forbiddenModules, reachableGraph } from "./graph.mjs";

const components = ["button", "input", "card"].map(
  (name) => `node_modules/@tangle-network/ui/dist/primitives/${name}.js`,
);
const clean = { modules: components, external: [] };
const syntax = "node_modules/react-syntax-highlighter/dist/esm/index.js";

test("visited-but-eliminated code is not emitted code", () => {
  const graph = emittedGraph({
    inputs: { [syntax]: {} },
    outputs: { "entry.js": { inputs: {
      [syntax]: { bytesInOutput: 0 },
      ...Object.fromEntries(components.map((name) => [name, { bytesInOutput: 10 }])),
    } } },
  });
  assertLightGraph(graph);
  assert.ok(!graph.modules.includes(syntax));
});

test("a heavy module in a lazy chunk fails the gauge", () => {
  const graph = emittedGraph({ outputs: {
    "entry.js": { inputs: Object.fromEntries(components.map((name) => [name, { bytesInOutput: 10 }])) },
    "lazy.js": { inputs: { [syntax]: { bytesInOutput: 1 } } },
  } });
  assert.throws(() => assertLightGraph(graph), /heavy code/);
});

test("the initial graph excludes a lazy syntax chunk while the complete graph retains it", () => {
  const metafile = { outputs: {
    "entry.js": { entryPoint: "markdown.mjs", imports: [{ path: "highlight.js", kind: "dynamic-import" }], inputs: { "markdown.mjs": { bytesInOutput: 30 } } },
    "highlight.js": { inputs: { [syntax]: { bytesInOutput: 20 } } },
  } };
  assert.deepEqual(reachableGraph(metafile, "markdown.mjs", { followDynamic: false }).outputPaths, ["entry.js"]);
  assert.ok(reachableGraph(metafile, "markdown.mjs").modules.includes(syntax));
});

test("externalizing a dependency cannot manufacture a small bundle", () => {
  const graph = emittedGraph({ outputs: { "entry.js": {
    inputs: {}, imports: [{ path: "@tiptap/react", external: true }],
  } } });
  assert.throws(() => assertLightGraph({ ...clean, external: graph.external }), /externals/);
});

test("an empty or partial fixture cannot pass", () => {
  assert.throws(() => assertLightGraph({ modules: [], external: [] }), /retain button/);
  assert.throws(() => assertLightGraph({ modules: components.slice(0, 2), external: [] }), /retain card/);
});

test("heavy families and internal output boundaries are rejected", () => {
  for (const name of [
    syntax, "node_modules/@tiptap/core/dist/index.js", "node_modules/@hocuspocus/provider/dist/index.js",
    "node_modules/prosemirror-view/dist/index.js", "node_modules/yjs/dist/yjs.mjs",
    "node_modules/@openuidev/react-lang/dist/index.js", "node_modules/@tangle-network/agent-runtime/dist/index.js",
    "node_modules/@tangle-network/ui/dist/openui.js", "node_modules/@tangle-network/ui/dist/markdown/code-block.js",
    "node_modules/@tangle-network/ui/dist/editor/editor-peers.js", "node_modules/@tangle-network/ui/dist/run.js",
  ]) assert.deepEqual(forbiddenModules({ modules: [name], external: [] }), [name]);
  assert.deepEqual(forbiddenModules(clean), []);
});

test("graphs normalize Windows paths and deduplicate shared inputs", () => {
  const graph = emittedGraph({ outputs: {
    "a.js": { inputs: { "node_modules\\react\\index.js": { bytesInOutput: 1 } } },
    "b.js": { inputs: { "node_modules/react/index.js": { bytesInOutput: 1 } } },
  } });
  assert.deepEqual(graph.modules, ["node_modules/react/index.js"]);
});

test("gzip and brotli count each resource separately and reproducibly", () => {
  const file = Buffer.from("export const answer = 42;\n".repeat(100));
  const once = compressedBytes([file]);
  assert.deepEqual(compressedBytes([file]), once);
  assert.deepEqual(compressedBytes([file, file]), Object.fromEntries(
    Object.entries(once).map(([name, bytes]) => [name, 2 * bytes]),
  ));
  assert.ok(once.gzip < once.raw && once.brotli < once.raw);
});

const entry = () => ({ entryPoint: 'light.mjs', inputs: Object.fromEntries(
  components.map((name) => [name, { bytesInOutput: 10 }])) });

test('an unreachable compiler entry remains visible separately from consumer code', () => {
  const metafile = { outputs: {
    'entry.js': entry(),
    'orphan.js': { entryPoint: 'unused-editor.mjs', inputs: { [syntax]: { bytesInOutput: 20 } } },
  } };
  const graph = reachableGraph(metafile, 'light.mjs');
  assertLightGraph(graph);
  assert.deepEqual(graph.outputPaths, ['entry.js']);
  assert.deepEqual(graph.orphanPaths, ['orphan.js']);
  assert.deepEqual(forbiddenModules(emittedGraph(metafile)), [syntax]);
});

test('all static, dynamic and shared edges enter the light gate', () => {
  for (const kind of ['import-statement', 'dynamic-import']) {
    const metafile = { outputs: {
      'entry.js': { ...entry(), imports: [{ path: 'shared.js', kind }] },
      'shared.js': { inputs: {}, imports: [{ path: 'lazy.js', kind: 'dynamic-import' }] },
      'lazy.js': { inputs: { [syntax]: { bytesInOutput: 20 } }, imports: [{ path: 'shared.js' }] },
    } };
    const graph = reachableGraph(metafile, 'light.mjs');
    assert.deepEqual(graph.outputPaths, ['entry.js', 'lazy.js', 'shared.js']);
    assert.deepEqual(graph.orphanPaths, []);
    assert.throws(() => assertLightGraph(graph), /heavy code/);
  }
});

test('missing, ambiguous or partial output graphs cannot manufacture a pass', () => {
  assert.throws(() => reachableGraph({ outputs: {} }, 'light.mjs'), /exactly one/);
  assert.throws(() => reachableGraph({ outputs: { 'a.js': entry(), 'b.js': entry() } }, 'light.mjs'), /exactly one/);
  assert.throws(() => reachableGraph({ outputs: {
    'entry.js': { ...entry(), imports: [{ path: 'missing.js' }] },
  } }, 'light.mjs'), /missing emitted import/);
});

test('reachable external dependencies still fail the consumer gate', () => {
  const graph = reachableGraph({ outputs: {
    'entry.js': { ...entry(), imports: [{ path: '@tiptap/core', external: true }] },
  } }, 'light.mjs');
  assert.throws(() => assertLightGraph(graph), /externals/);
});
