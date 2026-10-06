import assert from "node:assert/strict";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

// Read the emitted graph, not just metafile.inputs: bundlers may visit a module
// and then remove every byte of it. Include ALL chunks, including lazy ones.
export function emittedGraph(metafile) {
  const modules = new Set();
  const external = new Set();
  for (const output of Object.values(metafile.outputs)) {
    for (const [name, input] of Object.entries(output.inputs ?? {})) {
      if (input.bytesInOutput > 0) modules.add(name.replaceAll("\\", "/"));
    }
    for (const dependency of output.imports ?? []) {
      if (dependency.external) external.add(dependency.path);
    }
  }
  return { modules: [...modules].sort(), external: [...external].sort() };
}

// esbuild also emits dynamic-import entrypoints from eliminated modules. Keep
// those compiler artifacts visible, but follow every actual entry import when
// measuring a consumer, including dynamic edges and shared chunks.
export function reachableGraph(metafile, entryPoint, { followDynamic = true } = {}) {
  const outputs = metafile.outputs;
  const roots = Object.keys(outputs).filter((name) => outputs[name].entryPoint === entryPoint);
  assert.equal(roots.length, 1, `expected exactly one output for ${entryPoint}`);
  const visited = new Set();
  const pending = [...roots];
  while (pending.length) {
    const name = pending.pop();
    if (visited.has(name)) continue;
    visited.add(name);
    for (const dependency of outputs[name].imports ?? []) {
      if (!followDynamic && dependency.kind === "dynamic-import") continue;
      if (dependency.external) continue;
      assert.ok(Object.hasOwn(outputs, dependency.path), `missing emitted import: ${dependency.path}`);
      pending.push(dependency.path);
    }
  }
  const outputPaths = [...visited].sort();
  return {
    ...emittedGraph({ outputs: Object.fromEntries(outputPaths.map((name) => [name, outputs[name]])) }),
    outputPaths,
    orphanPaths: Object.keys(outputs).filter((name) => !visited.has(name)).sort(),
  };
}

export function compressedBytes(files) {
  const totals = { raw: 0, gzip: 0, brotli: 0 };
  for (const file of files) {
    // Sum independently compressed resources, not one artificially concatenated file.
    totals.raw += file.byteLength;
    totals.gzip += gzipSync(file, { level: 9 }).byteLength;
    totals.brotli += brotliCompressSync(file, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).byteLength;
  }
  return totals;
}

const heavy = [
  /(?:^|\/)(?:react-syntax-highlighter|highlight\.js|lowlight|refractor|prismjs|shiki|monaco-editor|codemirror|prosemirror-[^/]+|yjs|y-prosemirror|pdfjs-dist)(?:\/|$)/,
  /(?:^|\/)(?:@tiptap|@hocuspocus|@monaco-editor|@codemirror|@shikijs|@openuidev|@openui)(?:\/|$)/,
  /(?:^|\/)@tangle-network\/(?:agent(?:-[^/]+)?|sandbox(?:-[^/]+)?|hub-sdk|runtime)(?:\/|$)/,
  /(?:^|\/)@tangle-network\/ui\/dist\/(?:markdown|editor|openui(?:-schema)?|run|auth|chat|files|stores|sdk-hooks|tool-previews)(?:[/.]|$)/,
];

export function forbiddenModules(graph) {
  return [...graph.modules, ...graph.external].filter((name) =>
    heavy.some((pattern) => pattern.test(name)),
  );
}

export function assertLightGraph(graph) {
  assert.equal(graph.external.length, 0, "do not hide weight behind externals");
  assert.deepEqual(forbiddenModules(graph), [], "heavy code reached a light consumer");
  for (const component of ["button", "input", "card"]) {
    assert.ok(
      graph.modules.some((name) => name.endsWith(`/ui/dist/primitives/${component}.js`)),
      `the emitted graph must actually retain ${component}, not an empty fixture`,
    );
  }
}
