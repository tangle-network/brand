import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { build, version as esbuildVersion } from "esbuild";
import { assertLightGraph, compressedBytes, emittedGraph, forbiddenModules } from "./graph.mjs";

const fixtures = ["primitives", "root", "markdown", "editor"];
const sourceDirectory = import.meta.dirname;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Extend the existing clean npm consumer; never resolve UI from workspace source. */
export async function runUiImportFixtures({ root, packageDirectory, consumerDirectory, installedDirectory, tarballPath, workDirectory }) {
  execFileSync(process.execPath, ["--test", join(sourceDirectory, "graph.test.mjs")], { stdio: "inherit" });
  const work = join(workDirectory, "ui-imports");
  const reports = resolve(process.env.UI_IMPORTS_REPORT_DIR ?? join(root, "node_modules/.cache/ui-imports"));
  mkdirSync(work, { recursive: true });
  mkdirSync(reports, { recursive: true });
  const entries = join(consumerDirectory, "ui-imports");
  mkdirSync(entries, { recursive: true });
  for (const name of [...fixtures, "runtime"]) {
    cpSync(join(sourceDirectory, `${name}.mjs`), join(entries, `${name}.mjs`));
  }

  const manifest = json(join(installedDirectory, "package.json"));
  assert.equal(manifest.name, "@tangle-network/ui");
  assert.equal(manifest.sideEffects, false, "retain the existing side-effect contract");
  assert.ok(!lstatSync(installedDirectory).isSymbolicLink(), "UI must be a packed npm dependency, not a source link");
  const dependencyLock = readFileSync(join(consumerDirectory, "package-lock.json"));

  // Build the previous layout from EXACTLY the same source and pnpm toolchain.
  // The only overridden build options are unbundle and the temporary outDir.
  // This is a controlled build-layout comparison, not a claimed old-release run.
  const baselineDist = join(work, "baseline-dist");
  const baselineConfig = join(packageDirectory, `.ui-imports-${randomUUID()}.config.mjs`);
  writeFileSync(baselineConfig,
    `import config from "./tsdown.config.ts";\nexport default { ...config, unbundle: false, outDir: ${JSON.stringify(baselineDist)} };\n`, { flag: "wx" });
  try {
    execFileSync("pnpm", ["exec", "tsdown", "--config", baselineConfig], {
      cwd: packageDirectory, stdio: "inherit",
    });
  } finally {
    rmSync(baselineConfig, { force: true });
  }

  // Use the pnpm-packed manifest (workspace peers are already rewritten) and
  // package contents for both variants. Only dist differs in the baseline tgz.
  const staging = join(work, "before");
  mkdirSync(staging);
  execFileSync("tar", ["-xzf", tarballPath, "-C", staging]);
  rmSync(join(staging, "package/dist"), { recursive: true, force: true });
  cpSync(baselineDist, join(staging, "package/dist"), { recursive: true });
  const baselineTarball = join(work, "before.tgz");
  execFileSync("tar", ["-czf", baselineTarball, "-C", staging, "package"]);

  // Overlay each real tarball at the normal npm-installed dependency path.
  // Do not npm-install twice: that could re-resolve ranges and confound bytes.
  // Never touch peers, the consumer lockfile, or the repository's dist.
  function mountTarball(path) {
    rmSync(installedDirectory, { recursive: true, force: true });
    mkdirSync(installedDirectory, { recursive: true });
    execFileSync("tar", ["-xzf", path, "--strip-components=1", "-C", installedDirectory]);
    assert.deepEqual(json(join(installedDirectory, "package.json")), manifest);
    for (const value of Object.values(manifest.exports)) {
      for (const target of typeof value === "string" ? [value] : Object.values(value)) {
        assert.ok(existsSync(resolve(installedDirectory, target)), `missing packed export: ${target}`);
      }
    }
  }

  const buildOptions = {
    bundle: true, format: "esm", platform: "browser", target: "es2022",
    splitting: true, minify: true, treeShaking: true, sourcemap: false,
    legalComments: "none", define: { "process.env.NODE_ENV": '"production"' },
    conditions: ["browser", "production"], mainFields: ["browser", "module", "main"],
    entryNames: "entry", chunkNames: "chunks/[name]-[hash]",
    metafile: true, write: false, logLevel: "error",
  };
  async function measure(label) {
    const measurements = {};
    for (const fixture of fixtures) {
      const result = await build({
        ...buildOptions, absWorkingDir: consumerDirectory,
        entryPoints: [join(entries, `${fixture}.mjs`)],
        // Identical output paths in both runs: filenames cannot bias compression.
        outdir: join(consumerDirectory, "ui-imports-output", fixture),
      });
      const graph = emittedGraph(result.metafile);
      assert.equal(graph.external.length, 0, `${fixture}: no externalized dependencies in byte measurements`);
      assert.ok(Object.keys(result.metafile.inputs).every((name) => !name.startsWith("../") && !name.startsWith("/")),
        "consumer must not read workspace source or workspace dependencies");
      measurements[fixture] = {
        bytes: compressedBytes(result.outputFiles.map((file) => file.contents)),
        chunks: result.outputFiles.length, ...graph,
        forbidden: forbiddenModules(graph),
      };
      writeFileSync(join(reports, `${label}-${fixture}.metafile.json`), JSON.stringify(result.metafile, null, 2));
      console.log(`UI_IMPORTS ${label} ${fixture}: ${JSON.stringify(measurements[fixture].bytes)}; ${graph.modules.length} emitted modules`);
    }
    return measurements;
  }

  let before;
  try {
    mountTarball(baselineTarball);
    before = await measure("before");
  } finally {
    // A failed baseline must not leave the smoke consumer on the wrong package.
    mountTarball(tarballPath);
  }
  const after = await measure("after");
  assert.deepEqual(readFileSync(join(consumerDirectory, "package-lock.json")), dependencyLock,
    "the consumer dependency lock must not change between measurements");
  const report = {
    baseline: "same source and dependencies; pre-change bundled layout (unbundle:false)",
    candidate: "original pnpm-packed package, restored at its npm dependency path",
    revision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    node: process.version, esbuild: esbuildVersion,
    tsdown: execFileSync("pnpm", ["exec", "tsdown", "--version"], { cwd: packageDirectory, encoding: "utf8" }).trim(),
    workspaceLockSha256: sha256(readFileSync(join(root, "pnpm-lock.yaml"))),
    consumerLockSha256: sha256(dependencyLock),
    tarballSha256: { before: sha256(readFileSync(baselineTarball)), after: sha256(readFileSync(tarballPath)) },
    buildOptions, compression: { gzipLevel: 9, brotliQuality: 11, aggregation: "sum per emitted resource, including lazy chunks" },
    before, after,
  };
  // Retain full metafiles on disk, and emitted graphs in CI logs even without an
  // artifact-upload workflow. Never turn an unmeasured baseline into a number.
  writeFileSync(join(reports, "report.json"), JSON.stringify(report, null, 2));
  console.log(`UI_IMPORTS_REPORT ${JSON.stringify(report)}`);
  console.log(`UI import evidence: ${reports}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      "\n## Packed UI imports (same-source layout comparison)\n\n" +
      "| Consumer | Before gzip / Brotli | After gzip / Brotli |\n|---|---:|---:|\n" +
      fixtures.map((name) => `| ${name} | ${before[name].bytes.gzip} / ${before[name].bytes.brotli} | ${after[name].bytes.gzip} / ${after[name].bytes.brotli} |`).join("\n") +
      "\n\nBytes include every emitted chunk; React is bundled. Full emitted graphs are in `UI_IMPORTS_REPORT` in the job log.\n");
  }

  for (const fixture of ["primitives", "root"]) assertLightGraph(after[fixture]);
  assert.ok(after.markdown.modules.some((name) => name.includes("/react-syntax-highlighter/")),
    "the positive-control markdown fixture must retain syntax highlighting");
  for (const peer of ["@tiptap/core", "@tiptap/react"]) {
    assert.ok(after.editor.modules.some((name) => name.includes(`/${peer}/`)), `editor must retain ${peer}`);
  }

  // Separate behavioral proof; SSR/DOM-test helpers are NOT part of the byte
  // measurements. External React here shares the renderer instance; unlike
  // these runtime tests, the measured browser builds above have no externals.
  const runtime = join(consumerDirectory, "ui-imports-runtime.cjs");
  await build({
    absWorkingDir: consumerDirectory, entryPoints: [join(entries, "runtime.mjs")],
    outfile: runtime, bundle: true, platform: "node", format: "cjs", target: "node22",
    external: ["react", "react-dom", "react-dom/*"],
    define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error",
  });
  const require = createRequire(join(root, "package.json"));
  const bootstrap = join(consumerDirectory, "ui-imports-bootstrap.cjs");
  writeFileSync(bootstrap, `
const { JSDOM } = require(${JSON.stringify(require.resolve("jsdom"))});
const dom = new JSDOM('<div id="root"></div>', { url: 'https://consumer.invalid/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'DOMParser', 'MutationObserver']) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
}
for (const name of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) globalThis[name] = dom.window[name].bind(dom.window);
require('./ui-imports-runtime.cjs').verify().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => dom.window.close());
`);
  execFileSync(process.execPath, [bootstrap], {
    cwd: consumerDirectory, stdio: "inherit", timeout: 60000,
    env: { ...process.env, NODE_ENV: "production" },
  });
}
