import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { GATED, UsageError, DEFAULT_BASELINE, localSource, main, measure, readBaseline, remoteSource, risenFiles, updateBaseline, writeBaseline } from "../bin/tangle-drift.mjs";

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

test("counts sizing and type deviations, not token references", () => {
  const dir = join(tmp, "sizing");
  mkdirSync(dir);
  git(dir, "init", "-q", "-b", "main");
  write(dir, {
    "src/Form.tsx": [
      'export const a = <p className="text-[13px] sm:text-[0.8rem] text-[var(--text-control)] text-[length:var(--x)]" />;', // 2 literal font sizes
      'export const b = <div style={{ fontSize: 13, lineHeight: 1 }} />;', // 1 inline font size
      'export const c = <div className="h-[34px] min-h-[2.5rem] sm:size-[30px] max-h-[400px] h-[var(--control-height-md)] w-[12px]" />;', // 3 literal sizes
      'export const d = <><button type="button" /><input /><select /><textarea /><Button /><label /><input type="hidden" name="intent" /></>;', // 4 native controls; hidden form data is not one
      'export const e = <Button className="h-8 px-3 text-xs">Save</Button>;', // 1 override
      'export const f = <Button size="sm" className="w-full gap-2">Save</Button>;', // layout only: not an override
      'export const g = <Input className="max-sm:text-base" />;', // a variant-prefixed retype is still an override
      'export const h = <><h1 className="text-2xl">Billing</h1><PageHeader title="Billing" /><h2>Plan</h2></>;', // 1 hand-written page title
    ].join("\n"),
    "src/app.css": ".a { font-size: 13px; }\n.b { font-size: var(--text-control); }\n.c { font-size: 0.75rem; }\n", // 2 literal font sizes
  });
  commit(dir, "sizing");
  const { row } = measure("gtm", localSource(dir));
  assert.equal(row.font_size_literal, 5);
  assert.deepEqual(row.by_file.font_size_literal, { "src/Form.tsx": 3, "src/app.css": 2 });
  assert.equal(row.size_literal, 3);
  assert.equal(row.native_control, 4);
  assert.equal(row.control_override, 2);
  assert.equal(row.page_heading, 1);
});

test("counts local re-drawings of the shared conversation shell", () => {
  const dir = join(tmp, "shell");
  mkdirSync(dir);
  git(dir, "init", "-q", "-b", "main");
  write(dir, {
    "src/Chat.tsx": [
      'import { PanelRightOpen, PanelLeftClose, PanelLeft } from "lucide-react";', // 3 pane-toggle icons
      'export const a = <div className="bg-[var(--md3-surface-dim)] p-2"><section /></div>;', // 1 own recessed gutter
      'export const b = <WorkspaceLayout collapsedControlsPlacement="overlay" centerHeaderVisibility="always" />;', // 2 moved seams
      'export const c = <WorkspaceLayout surface="flat" />;', // 1 flattened surface
      'export const d = <AgentWorkspaceCompanion header={<span>Plan</span>} />;', // the supported slot: not an override
      'export const e = <PanelRightContent surface="inset" />;', // neither an icon nor a flat surface
    ].join("\n"),
    "src/chat.css": ".chat { background: var(--md3-surface-dim); }\n", // 1
  });
  commit(dir, "shell");
  const { row } = measure("gtm", localSource(dir));
  assert.equal(row.shell_override, 8);
  assert.deepEqual(row.by_file.shell_override, { "src/Chat.tsx": 7, "src/chat.css": 1 });
});

test("counts header rows given their own height, across lines, and nothing inside a header", () => {
  const dir = join(tmp, "header");
  mkdirSync(dir);
  git(dir, "init", "-q", "-b", "main");
  write(dir, {
    "src/app.css": [
      ".ha-conversation-header { min-height: 66px; padding: 11px 32px; }", // 1
      ".ha-first header { height: 68px; }", // 1: the element itself
      ".ha-files-bar {", // 1: a multi-line rule
      "  display: flex;",
      "  min-height: 56px;",
      "}",
      "@media (max-width: 600px) { .ha-inbox-detail-head:hover { min-height: 3.5rem } }", // 1: inside a media block, with a pseudo-class
      ".ha-header-avatar { height: 30px; }", // inside a header, not the row
      ".ha-conversation-header .ha-mark { height: 30px; }", // a descendant, not the row
      ".ha-progress-bar { height: 4px; } .ha-sidebar { height: 100vh; }", // not header rows
      ".ha-page-header { height: var(--shell-header-height); min-height: auto; }", // token and non-length
      ".ha-conversation-header h1 { font-size: var(--text-base); }", // no height
      "/* .note-header { min-height: 40px } documents a rule; it styles nothing */",
      ".create-steps-bar { height: 4px; }", // a step-progress bar, not a header row
    ].join("\n"),
    "src/Page.tsx": [
      'export const a = <header className="flex h-16 items-center border-b" />;', // 1
      'export const b = <div className="ha-files-toolbar flex min-h-[58px]" />;', // 1: a header-row class with a literal height
      'export const c = <header className="flex h-[var(--shell-header-height)]" />;', // token
      'export const d = <ShellHeader className="gap-2"><span className="h-4 w-4" /></ShellHeader>;', // the primitive; an icon inside it
      'export const e = <div className="ha-card h-12" />;', // not a header row
    ].join("\n"),
  });
  commit(dir, "header");
  const { row, matches } = measure("hospitality", localSource(dir));
  assert.deepEqual(matches.header_height_literal.map((m) => `${m.path}:${m.line}`),
    ["src/Page.tsx:1", "src/Page.tsx:2", "src/app.css:1", "src/app.css:2", "src/app.css:3", "src/app.css:7"]);
  assert.equal(row.header_height_literal, 6);
});

test("counts product rules that restyle transcript text", () => {
  const dir = join(tmp, "transcript");
  mkdirSync(dir);
  git(dir, "init", "-q", "-b", "main");
  write(dir, {
    "src/chat.css": [
      ".ha-chat-scroll .tangle-prose,", // 1: a selector list across lines
      ".ha-build .tangle-prose {",
      "  font-size: var(--text-base);",
      "  line-height: 1.6;",
      "}",
      ".ha-chat [data-timeline-step='user'] + [data-timeline-step] { margin-top: 24px; }", // spacing, not type
      ".ha-chat [data-timeline-step='user'] div { font: 400 14px/1.4 Georgia, serif; }", // 1
      "/* The transcript reads at brand's scale; .tangle-prose { font-size: 18px } is not set here. */",
      "[data-role=\"assistant\"] p { line-height: 1.75 !important; }", // 1: a message role attribute
      "[data-assistant-prose] h2 { font-size: 1.25em; } .tangle-prose code { font-size: .9em; }", // headings and code keep their sizes
    ].join("\n"),
    "src/Chat.tsx": [
      'export const a = <Markdown className="tangle-prose text-sm leading-7" />;', // 1
      'export const b = <Markdown className="tangle-prose mt-2" />;', // layout only
    ].join("\n"),
  });
  commit(dir, "transcript");
  const { row } = measure("hospitality", localSource(dir));
  assert.equal(row.transcript_type_override, 4);
  assert.deepEqual(row.by_file.transcript_type_override, { "src/Chat.tsx": 1, "src/chat.css": 3 });
});

test("hex ignores issue references in comments but counts colours in code and CSS", () => {
  const dir = join(tmp, "hex-comments");
  mkdirSync(dir);
  git(dir, "init", "-q", "-b", "main");
  write(dir, {
    "src/Page.tsx": [
      "// a hook after them blanked the page (React error #310), see (#346)",
      "/* also #abc in a block comment */",
      'export const a = <div style={{ color: "#123456" }} />; // #fff here is a comment',
      'export const url = "https://example.com/#top";',
    ].join("\n"),
    "src/app.css": ".a { color: #fff; } /* #000 */\n",
  });
  commit(dir, "hex");
  const { row, matches } = measure("hospitality", localSource(dir));
  assert.deepEqual(matches.hex.map((m) => m.match), ["#123456", "#fff"]);
  assert.equal(row.hex, 2);
});

test("settings_layout counts settings pages that do not compose settings-react, and gates new ones", () => {
  const dir = join(tmp, "settings");
  mkdirSync(dir);
  git(dir, "init", "-q", "-b", "main");
  const shared = 'import { SettingsLayout } from "@tangle-network/agent-app/settings-react";\n';
  write(dir, {
    "src/routes/app.workspace.settings.tsx": shared, // composes, so its section routes are covered
    "src/routes/app.workspace.settings.team.tsx": "export default function Team() {}\n",
    "src/routes/app.workspace.settings_.export.tsx": "export default function Export() {}\n", // 1: leaves the layout
    "src/routes/app.account.settings.tsx": `// ${shared}`, // 1: a comment composes nothing
    "app/org/settings/layout.tsx": shared, // a Next.js layout covers the pages beneath it
    "app/org/settings/billing/page.tsx": "export default function Billing() {}\n",
    "app/settings/page.tsx": shared, // a page covers only itself
    "app/settings/team/page.tsx": "export default function Team() {}\n", // 1
    "src/pages/settings/index.astro": `---\n${shared}---\n`, // an index covers only itself
    "src/pages/settings/team.astro": "<div />\n", // 1
    "src/web/SSOSettings.tsx": "export function SSOSettings() {}\n", // 1: named for its settings
    "src/pages/dashboard/settings/DangerZoneSection.tsx": "export function DangerZoneSection() {}\n", // a part of a page
    "src/components/settings/Toggle.tsx": "export function Toggle() {}\n", // neither a page nor named for settings
    "src/hooks/useSettings.tsx": "export function useSettings() {}\n", // a hook, not a page
    "src/components/header/SettingsMenu.tsx": "export function SettingsMenu() {}\n", // a control, not a page
    "src/routes/app.settings.test.tsx": "export {};\n", // tests are excluded
  });
  commit(dir, "settings");
  const { row } = measure("gtm", localSource(dir));
  assert.deepEqual(Object.keys(row.by_file.settings_layout),
    ["app/settings/team/page.tsx", "src/pages/settings/team.astro", "src/routes/app.account.settings.tsx",
      "src/routes/app.workspace.settings_.export.tsx", "src/web/SSOSettings.tsx"]);

  // A consumer baseline written before the metric existed reports it without gating it.
  const baselinePath = join(tmp, "settings-baseline.json");
  const older = { ...row, by_file: { ...row.by_file } };
  delete older.settings_layout;
  delete older.by_file.settings_layout;
  writeBaseline(baselinePath, { gtm: older });
  const run = (...args) => {
    const lines = [];
    const code = main(["check", "--surface", "gtm", "--repo-dir", dir, "--baseline", baselinePath, ...args], (s) => lines.push(s));
    return { code, out: lines.join("\n") };
  };
  const unrecorded = run();
  assert.equal(unrecorded.code, 0);
  assert.match(unrecorded.out, /not yet in this baseline \(not gated\): settings_layout=5/);
  assert.equal(run("--update-baseline").code, 0);
  assert.equal(readBaseline(baselinePath).gtm.settings_layout, 5);

  write(dir, { "src/routes/app.billing-settings.tsx": "export default function Billing() {}\n" });
  commit(dir, "a new local settings page");
  const planted = run();
  assert.equal(planted.code, 1);
  assert.match(planted.out, /FAIL settings_layout: 6 > baseline 5/);
  assert.match(planted.out, /src\/routes\/app\.billing-settings\.tsx:1: imports nothing from @tangle-network\/agent-app\/settings-react/);

  write(dir, { "src/routes/app.billing-settings.tsx": shared, "src/routes/app.workspace.settings_.export.tsx": shared });
  commit(dir, "compose both from settings-react");
  const adopted = run();
  assert.equal(adopted.code, 0);
  assert.match(adopted.out, /lower than baseline: settings_layout 5 -> 4/);
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
  const base = { gtm: Object.fromEntries(GATED.map((m) => [m, 0])) };
  Object.assign(base.gtm, { raw_palette: 3, hex: 4 });
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
  assert.deepEqual(Object.keys(baseline), ["website", "sandbox", "platform", "intelligence", "gtm", "tax", "legal", "insurance", "creative", "physim", "hospitality", "audits", "browser", "builder", "blueprint", "super"]);
  for (const row of Object.values(baseline)) {
    for (const metric of GATED) assert.equal(typeof row[metric], "number", metric);
    assert.match(row.head, /^[0-9a-f]{12}$/);
  }
});
