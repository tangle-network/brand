import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { UsageError, compare, DEFAULT_BASELINE, localSource, main, measure, readBaseline, remoteSource, risenFiles, updateBaseline } from "../bin/tangle-drift.mjs";

const tmp = mkdtempSync(join(tmpdir(), "tangle-drift-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

const git = (dir, ...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });
function write(dir, files) {
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), body);
  }
}
function commit(dir, message) {
  git(dir, "add", "-A");
  git(dir, "-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", message);
}

const FIXTURE = {
  // Directly inside the web root: the pathspec must not skip it.
  "App.tsx": [
    'import { Button } from "@tangle-network/ui";',
    'import { cn } from "@tangle-network/brand/utils";',
    'export const a = "bg-amber-500 text-slate-50 hover:bg-red-600";', // 3 palette
    'export const notPalette = "bg-amber bg-primary-500 text-gray-5";', // 0: no shade or not a palette hue
    'export const hexes = ["#fff", "#A1b2C3", "#ffffffff", "#12"];', // 2 hex: 8- and 2-digit forms are not counted
    'export const arb = "bg-[#123456] text-[rgb(1,2,3)] w-[12px]";', // 2 arbitrary colors, 1 hex
  ].join("\n"),
  "src/components/Button.tsx": "export function Button() { return null }\nexport default function Card() {}\nexport const Tooltip = 1\nexport function ButtonGroup() {}\n",
  "src/styles.css": ":root {\n  --brand-x: #000;\n  --brand-y: 1px;\n}\n.a { color: var(--brand-x); }\n",
  // Excluded paths.
  "src/App.test.tsx": 'const x = "bg-amber-500 #ffffff";',
  "node_modules/pkg/index.tsx": 'const x = "bg-amber-500";',
  "src/Foo.stories.tsx": 'const x = "bg-amber-500";',
  "src/types.d.ts": 'type X = "bg-amber-500";',
  "package.json": JSON.stringify({ dependencies: { "@tangle-network/brand": "1.10.3", react: "19" }, pnpm: { overrides: { "@tangle-network/ui": "11.0.0" } } }),
};

const repo = join(tmp, "consumer");
mkdirSync(repo);
git(repo, "init", "-q", "-b", "main");
write(repo, FIXTURE);
commit(repo, "fixture");

test("counts each metric with drift.py's patterns and pathspecs", () => {
  const { row, matches } = measure("gtm", localSource(repo));
  assert.equal(row.raw_palette, 3);
  assert.deepEqual(matches.raw_palette.map((m) => m.match), ["bg-amber-500", "text-slate-50", "bg-red-600"]);
  assert.equal(row.hex, 4); // #fff, #A1b2C3, #123456 in App.tsx; #000 in styles.css
  assert.equal(row.arbitrary_color, 2);
  assert.equal(row.css_var_defs, 2); // definitions only, not var() references
  assert.equal(row.local_primitive_count, 3); // ButtonGroup is not a primitive name
  assert.deepEqual(row.local_primitives, { Button: 1, Card: 1, Tooltip: 1 });
  assert.deepEqual(row.by_file.raw_palette, { "App.tsx": 3 });
  assert.equal(row.importing_files.ui, 1);
  assert.equal(row.importing_files.brand, 1);
  assert.deepEqual(row.versions, { brand: ["1.10.3"], "override:ui": ["11.0.0"] });
  assert.equal(row.tsx_files, 2);
  assert.equal(row.css_files, 1);
});

test("compare reports rises and falls on gated metrics only", () => {
  const base = { raw_palette: 3, hex: 4, arbitrary_color: 2, css_var_defs: 2, local_primitive_count: 3, importing_files: { ui: 9 } };
  assert.deepEqual(compare(base, { ...base, importing_files: { ui: 0 } }), { rises: [], falls: [] });
  const { rises, falls } = compare(base, { ...base, raw_palette: 4, hex: 1 });
  assert.deepEqual(rises, [{ metric: "raw_palette", base: 3, now: 4 }]);
  assert.deepEqual(falls, [{ metric: "hex", base: 4, now: 1 }]);
});

test("risenFiles names the files above their own baseline count", () => {
  const base = { by_file: { raw_palette: { "a.tsx": 2, "b.tsx": 1 } } };
  const now = { by_file: { raw_palette: { "a.tsx": 1, "b.tsx": 3, "c.tsx": 1 } } };
  assert.deepEqual(risenFiles(base, now, "raw_palette"), [
    { path: "b.tsx", base: 1, now: 3 },
    { path: "c.tsx", base: 0, now: 1 },
  ]);
});

test("updateBaseline lowers freely and refuses a rise without allowRise", () => {
  const base = { gtm: { raw_palette: 3, hex: 4, arbitrary_color: 0, css_var_defs: 0, local_primitive_count: 0 } };
  const lower = { ...base.gtm, hex: 2 };
  assert.deepEqual(updateBaseline(base, { gtm: lower }).next.gtm, lower);
  const higher = { ...base.gtm, raw_palette: 5 };
  const refused = updateBaseline(base, { gtm: higher });
  assert.deepEqual(refused.next.gtm, base.gtm);
  assert.equal(refused.refused[0].surface, "gtm");
  assert.deepEqual(updateBaseline(base, { gtm: higher }, { allowRise: true }).next.gtm, higher);
});

test("check gate: equal passes, a committed or uncommitted plant fails, removal passes with a lower hint", () => {
  const baselinePath = join(tmp, "baseline.json");
  const run = (...args) => {
    const lines = [];
    const code = main(["check", "--surface", "gtm", "--repo-dir", repo, "--baseline", baselinePath, ...args], (s) => lines.push(s));
    return { code, out: lines.join("\n") };
  };
  assert.equal(run("--update-baseline").code, 0);
  assert.equal(readBaseline(baselinePath).gtm.raw_palette, 3);
  assert.match(run().out, /ok, equal to baseline/);

  write(repo, { "src/Planted.tsx": 'export const p = <div className="bg-amber-500" />;\n' });
  assert.equal(run().code, 0, "HEAD does not include the uncommitted plant");
  const dirty = run("--worktree");
  assert.equal(dirty.code, 1);
  assert.match(dirty.out, /FAIL raw_palette: 4 > baseline 3/);
  assert.match(dirty.out, /src\/Planted\.tsx: 0 -> 1/);
  assert.match(dirty.out, /src\/Planted\.tsx:1: export const p = <div className="bg-amber-500" \/>;/);

  commit(repo, "plant");
  assert.equal(run().code, 1);
  const refused = run("--update-baseline");
  assert.equal(refused.code, 1);
  assert.match(refused.out, /refused to raise gtm/);
  assert.equal(readBaseline(baselinePath).gtm.raw_palette, 3);

  git(repo, "rm", "-q", "src/Planted.tsx");
  write(repo, { "App.tsx": FIXTURE["App.tsx"].replace("bg-amber-500 ", "") });
  commit(repo, "remove plant and one more");
  const lower = run();
  assert.equal(lower.code, 0);
  assert.match(lower.out, /lower than baseline: raw_palette 3 -> 2/);
  assert.match(lower.out, /--update-baseline/);
  assert.equal(run("--update-baseline").code, 0);
  assert.equal(readBaseline(baselinePath).gtm.raw_palette, 2);
});

test("remote mode shallow-fetches the default branch into the cache", () => {
  const remotes = join(tmp, "remotes");
  mkdirSync(join(remotes, "tangle-network"), { recursive: true });
  git(tmp, "clone", "-q", "--bare", "--no-local", repo, join(remotes, "tangle-network", "gtm-agent.git"));
  process.env.TANGLE_DRIFT_REMOTE_PREFIX = `file://${remotes}/`;
  process.env.TANGLE_DRIFT_CACHE = join(tmp, "cache");
  try {
    const source = remoteSource("tangle-network/gtm-agent");
    assert.equal(source.branch, "main");
    assert.equal(source.head, git(repo, "rev-parse", "HEAD").trim().slice(0, 12));
    assert.equal(measure("gtm", source).row.raw_palette, measure("gtm", localSource(repo)).row.raw_palette);
  } finally {
    delete process.env.TANGLE_DRIFT_REMOTE_PREFIX;
    delete process.env.TANGLE_DRIFT_CACHE;
  }
});

test("a surface reads only its web root, at every depth, and SUPER also counts .js and .html", () => {
  const mono = join(tmp, "mono");
  mkdirSync(mono);
  git(mono, "init", "-q", "-b", "main");
  write(mono, {
    "products/sandbox/web/App.tsx": 'const a = "bg-red-500";', // directly inside the root
    "products/sandbox/web/src/deep/X.tsx": 'const a = "text-blue-400 #abc";',
    "products/platform/web/App.tsx": 'const a = "bg-red-500";', // another surface's root
    "public/app.js": 'el.className = "bg-red-500"; el.style.color = "#123456";',
    "public/index.html": '<div class="text-sky-300"></div>',
  });
  commit(mono, "mono");
  const sandbox = measure("sandbox", localSource(mono)).row;
  assert.deepEqual(sandbox.by_file.raw_palette, { "products/sandbox/web/App.tsx": 1, "products/sandbox/web/src/deep/X.tsx": 1 });
  assert.equal(sandbox.hex, 1);
  const superRow = measure("super", localSource(join(mono, "public"))).row; // --repo-dir may be a subdirectory
  assert.equal(superRow.raw_palette, 2);
  assert.equal(superRow.hex, 1);
  assert.equal(superRow.tsx_files, 2);
});

test("a surface missing from the baseline fails check", () => {
  const lines = [];
  const code = main(["check", "--surface", "legal", "--repo-dir", repo, "--baseline", join(tmp, "empty.json")], (s) => lines.push(s));
  assert.equal(code, 1);
  assert.match(lines.join("\n"), /no baseline row for legal/);
});

test("contradictory or unsafe arguments are refused", () => {
  const refuse = (args, pattern) => assert.throws(() => main(args, () => {}), (e) => e instanceof UsageError && pattern.test(e.message));
  refuse(["check", "--surface", "gtm", "--repo-dir", repo, "--update-baseline"], /only from --remote/);
  refuse(["check", "--surface", "gtm", "--repo-dir", repo, "--worktree", "--update-baseline", "--baseline", join(tmp, "x.json")], /--worktree/);
  refuse(["check", "--surface", "gtm", "--repo-dir", repo, "--worktree", "--rev", "HEAD~1"], /not both/);
  refuse(["scan", "--surface", "gtm", "--repo-dir", repo, "--update-baseline", "--baseline", join(tmp, "x.json")], /only applies to check/);
  refuse(["check", "--surface", "gtm", "--repo-dir", repo, "--top", "abc"], /--top/);
  refuse(["check", "--surface", "nope", "--repo-dir", repo], /unknown surface/);
  refuse(["check", "--surface", "gtm"], /exactly one of/);
  refuse(["check", "--surface", "gtm", "--repo-dir", repo, "--allow-rise"], /--allow-rise/);
  assert.ok(DEFAULT_BASELINE.endsWith("drift-baseline.json"));
});

test("the shipped baseline has a row with every gated count for each surface", () => {
  const baseline = readBaseline(DEFAULT_BASELINE);
  assert.deepEqual(Object.keys(baseline), ["website", "sandbox", "platform", "intelligence", "gtm", "tax", "legal", "creative", "physim", "hospitality", "audits", "browser", "builder", "blueprint", "super"]);
  for (const row of Object.values(baseline)) {
    for (const metric of ["raw_palette", "hex", "arbitrary_color", "css_var_defs", "local_primitive_count"]) assert.equal(typeof row[metric], "number");
    assert.match(row.head, /^[0-9a-f]{12}$/);
  }
});
