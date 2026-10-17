#!/usr/bin/env node
/**
 * tangle-drift: a ratchet on design-system drift across Tangle product surfaces.
 *
 * It counts raw Tailwind palette classes, hex literals, arbitrary color values,
 * CSS custom-property definitions, locally defined primitives, and the sizing and
 * type deviations that bypass the shared control scale (literal font sizes and
 * heights, native controls, restyled shared controls, hand-written page titles),
 * local re-drawings of the shared conversation shell, and settings pages drawn
 * without the shared settings layout in a surface's source,
 * reading a git tree with `git grep` (no checkout of the tree needed).
 * The counts committed in drift-baseline.json beside this file may only fall.
 *
 *   tangle-drift check --surface gtm --repo-dir .          # consumer gate, reads HEAD
 *   tangle-drift check --surface gtm --repo-dir . --worktree   # include uncommitted files
 *   tangle-drift scan --remote                             # every surface, default branches
 *   tangle-drift check --all --remote --update-baseline    # lower the baseline
 *
 * Port of company wiki/evidence/ui-unification-2026-10-05/drift.py; the patterns
 * and pathspecs are kept identical so counts stay comparable with that baseline.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_BASELINE = fileURLToPath(new URL("./drift-baseline.json", import.meta.url));

/** surface → GitHub repository and web roots. The default branch is resolved from the remote. */
export const SURFACES = {
  router: { repo: "tangle-network/tangle-router", roots: ["src/views", "app/globals.css"] },
  website: { repo: "tangle-network/tangle-website", roots: ["src"] },
  sandbox: { repo: "tangle-network/agent-container", roots: ["products/sandbox/web"] },
  platform: { repo: "tangle-network/agent-container", roots: ["products/platform/web"] },
  intelligence: { repo: "tangle-network/agent-container", roots: ["products/intelligence/web"] },
  gtm: { repo: "tangle-network/gtm-agent", roots: [""] },
  tax: { repo: "tangle-network/tax-agent", roots: ["apps/web"] },
  legal: { repo: "tangle-network/legal-agent", roots: [""] },
  insurance: { repo: "tangle-network/insurance-agent", roots: [""] },
  creative: { repo: "tangle-network/creative-agent", roots: [""] },
  physim: { repo: "tangle-network/hardware-agent", roots: ["apps/web"] },
  hospitality: { repo: "tangle-network/hospitality-agent", roots: [""] },
  audits: { repo: "tangle-network/redteam", roots: ["packages/website"] },
  browser: { repo: "tangle-network/bad-app", roots: [""] },
  builder: { repo: "tangle-network/agent-builder", roots: [""] },
  blueprint: { repo: "tangle-network/blueprint-agent", roots: ["apps/web"] },
  // SUPER's interface is plain JavaScript and HTML, so its colors live in those files.
  super: { repo: "tangle-network/super-agent", roots: ["public"], extraExt: ["*.js", "*.html"] },
};

const SRC_EXT = ["*.tsx", "*.ts", "*.jsx", "*.astro", "*.css", "*.vue", "*.svelte"];
const EXCLUDE = [":!*node_modules*", ":!*dist/*", ":!*.test.*", ":!*.spec.*", ":!*stories*", ":!*__tests__*",
  ":!*tests/*", ":!*e2e/*", ":!*fixtures*", ":!*.generated.*", ":!*proof*", ":!*evidence*", ":!*.d.ts"];
const PRIMS = "Button|IconButton|Badge|Card|Chip|Tag|Pill|Avatar|Dialog|Modal|Sheet|Drawer|Tooltip|Popover|DropdownMenu|Menu|Input|Textarea|Select|Combobox|Checkbox|Switch|Toggle|Tabs|Skeleton|Spinner|EmptyState|Callout|Alert|Toast|Table|Progress|Separator|Label|Field|StatusBadge|StatusDot|Kbd";

/** PCRE patterns, passed to `git grep -P`. */
export const PATTERNS = {
  raw_palette: String.raw`\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|divide|decoration|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b`,
  arbitrary_color: String.raw`-\[(?:#|rgb|hsl|oklch)`,
  css_var_defs: String.raw`^\s*--[a-zA-Z0-9-]+\s*:`,
  local_primitive_count: String.raw`export\s+(?:default\s+)?(?:function|const)\s+(?:${PRIMS})\b`,
  // Sizes and type that bypass Brand's control and type scale. Token references such as
  // `text-[var(--text-control)]` and `h-[var(--control-height-md)]` are not counted.
  // A literal Tailwind size (`text-[13px]`), an inline `fontSize: 13`, or a CSS `font-size: 13px`.
  font_size_literal: String.raw`\btext-\[(?:[0-9.]+(?:px|rem|em)\b|calc\(|clamp\()|\bfontSize:\s*["'\x60]?[0-9.]+|font-size:\s*[0-9.]+(?:px|rem|em)\b`,
  // A literal height or square size (`h-[34px]`, `min-h-[2.4rem]`, `size-[30px]`).
  size_literal: String.raw`(?<![\w-])(?:h|min-h|size)-\[[0-9.]+(?:px|rem)\]`,
  // A native control element in product code; Button, Input, Textarea, Select, DatePicker and
  // TimeSelect own them. A `type="hidden"` input carries form data and is not a control.
  native_control: String.raw`<(?:button|select|textarea)\b|<input\b(?![^>]*\btype=["']hidden["'])`,
  // A shared control resized or retyped in place. Line-based: a className on its own line
  // after the tag is not seen, so this undercounts and only ratchets what it can see.
  control_override: String.raw`<(?:Button|Input|Textarea|SelectTrigger)\b[^>]*?\bclassName=[^>]*?(?<![\w-])(?:h-|min-h-|size-|px-|py-|text-(?:xs|sm|base|lg|\[)|rounded-|font-(?:normal|medium|semibold|bold)\b)`,
  // A hand-written page title; PageHeader owns the title, description and actions row.
  page_heading: String.raw`<h1\b`,
  // A product re-drawing the conversation shell that AgentWorkspaceCompanion owns: its own
  // recessed backdrop for a gutter, its own pane expander icons, or a WorkspaceLayout seam
  // that moves the shell's controls or flattens its surface.
  shell_override: String.raw`md3-surface-dim|\bPanel(?:Right|Left)(?:Open|Close)?\b|\b(?:collapsedControlsPlacement|centerHeaderVisibility)\b|\bsurface=["'{]+flat\b`,
};

// Header-like: an element named `header`, or a class/id ending in one of the words below. It must be
// the selector's last compound (pseudo-classes and attributes aside), so `.top-header .avatar`
// and `.top-header-avatar` size something inside a header, not the header row.
// A `-bar` row counts too (`.files-bar`), but not a progress, scroll, side or meter bar.
const HEADER_WORD = String.raw`(?:header|head|topbar|toolbar|titlebar|appbar|navbar|(?<![\w-]*(?:progress|scroll|side|meter|loading|track|fill|status|steps?)-?)bar)`;
const HEADER_COMPOUND = String.raw`(?:[\w#.:-]*[.#-]${HEADER_WORD}|(?<![\w.#-])header)(?![\w-])(?::{1,2}[\w-]+(?:\([^)]*\))?|\[[^\]]*\])*`;
const LITERAL_HEIGHT_UTILITY = String.raw`(?<![\w-])(?:h|min-h|max-h)-(?:[0-9]|\[(?!var\())`;

/**
 * Metrics that span lines, so they read whole files rather than `git grep` lines. Each is a set
 * of JavaScript patterns run over a file's text; `prefilter` selects candidate files with
 * `git grep -l` and the same pathspecs, so the excluded paths match the line metrics.
 */
export const RULE_PATTERNS = {
  // A colour literal: `#rgb` or `#rrggbb`. Read as a rule metric so comments are blanked first: an
  // issue reference such as "React error #310" or "(#346)" in a comment is not a colour.
  hex: {
    prefilter: String.raw`#[0-9a-fA-F]{3}`,
    patterns: [String.raw`#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b`],
  },
  // A header row given its own height. The shell owns one header height
  // (`--shell-header-height`, `ShellHeader`); content fills the row and never sets it, so the
  // main pane's divider lands on the sidebar's. Token references (`var(--shell-header-height)`)
  // and non-length values (`auto`, `100%`) are not counted.
  header_height_literal: {
    prefilter: String.raw`height|\bh-`,
    patterns: [
      // CSS: `.x-header { min-height: 66px }`, `.page header { height: 4rem }`, across lines.
      String.raw`(?<=^|[\s{},;>+~])${HEADER_COMPOUND}\s*(?:,[^{};]*)?\{[^{}]*?(?<![\w-])(?:min-|max-)?height\s*:\s*[0-9.]+(?:px|rem|em)\b`,
      // JSX: `<header className="h-16">`, or any element whose class names a header row and a height.
      String.raw`<header\b[^>]*?\bclassName=\{?["'\x60][^"'\x60]*?${LITERAL_HEIGHT_UTILITY}`,
      String.raw`(?<!<header\b[^>]*)\bclassName=\{?["'\x60](?=[^"'\x60]*(?<![\w-])[\w-]*${HEADER_WORD}(?![\w-]))[^"'\x60]*?${LITERAL_HEIGHT_UTILITY}`,
    ],
  },
  // Product CSS restyling transcript text (by class, timeline step, or a message role attribute such
  // as [data-role="assistant"]). Brand's `tangle-transcript-text` gives the person's and
  // the agent's messages one family, size and leading; an app rule on `.tangle-prose` or a
  // timeline step re-splits them (an agent message at 16px beside a 15px user message).
  transcript_type_override: {
    prefilter: String.raw`tangle-prose|tangle-transcript-text|data-timeline-step|transcript|data-role|data-message-role|data-assistant-prose`,
    patterns: [
      String.raw`(?:tangle-prose|tangle-transcript-text|data-timeline-step|transcript|data-(?:message-)?role=["']?(?:assistant|user|agent)|data-assistant-prose)[^{};]*?(?<![\s>+~](?:h[1-6]|code|pre|kbd|table|th|td)\s*)\{[^{}]*?(?<![\w-])(?:font-size|line-height|font-family|font)\s*:`,
      String.raw`\bclassName=\{?["'\x60](?=[^"'\x60]*\btangle-(?:prose|transcript-text)\b)[^"'\x60]*?(?<![\w-])(?:text-(?:xs|sm|base|lg|xl|\[)|leading-|font-(?:sans|serif|mono))`,
    ],
  },
};

/**
 * Metrics that count page files rather than matches. A candidate is a page file under the surface's
 * pathspecs whose path names `name` (in any case). A page file is a route or page module (under a
 * `routes`, `pages` or `views` directory, unless its name ends in a part word: a card, section or
 * dialog is drawn inside a page and is not one), a Next.js `page` or `layout` file, or a file
 * elsewhere named for `name` whose last word is `name` or a page word (`BusinessSettings.tsx`,
 * `SettingsTab.tsx`; not a `useSettings` hook or a `SettingsMenu`). A candidate is counted unless it
 * imports `composes`, or it sits under a composing layout, the one kind of module that renders the
 * routes beneath it: a Next.js `layout`, or a `routes` module other than an index. A composing
 * `page` or `index` covers only itself. Nesting is read from the path, at `/` and at the dots of
 * flat route file names, so `app.settings.tsx` holds `app.settings.team.tsx` and
 * `app.settings/Billing.tsx` but not `app.settings_.team.tsx`, which leaves its parent's layout.
 */
export const PAGE_PATTERNS = {
  // A settings page drawn locally. agent-app's settings-react owns the settings composition: the
  // section nav, frame, rows and save behaviour.
  settings_layout: {
    name: "settings",
    composes: String.raw`(?:\bfrom|\bimport)\s*\(?\s*["']@tangle-network/agent-app/settings-react(?:/[^"']*)?["']`,
    reason: "imports nothing from @tangle-network/agent-app/settings-react",
  },
};
const PAGE_DIR = /(?:^|\/)(?:routes|pages|views)\//i;
const ROUTES_DIR = /(?:^|\/)routes\//i;
const PAGE_PARTS = ["card", "cards", "section", "sections", "dialog", "modal", "sheet", "drawer", "panel", "form", "row", "field"];
const PAGE_WORDS = ["page", "tab", "view", "screen"];

const LOCAL_PRIM_NAME = new RegExp(String.raw`(?:function|const)\s+(${PRIMS})\b`);
const SHARED = ["@tangle-network/brand", "@tangle-network/ui", "@tangle-network/sandbox-ui", "@tangle-network/agent-app"];

/** The counts the gate ratchets. Everything else in a row is informational. */
const LINE_METRICS = Object.keys(PATTERNS);
export const GATED = [LINE_METRICS[0], "hex", ...LINE_METRICS.slice(1), ...Object.keys(RULE_PATTERNS).filter((m) => m !== "hex"),
  ...Object.keys(PAGE_PATTERNS)];

function extensions(surface, metric) {
  const extra = SURFACES[surface]?.extraExt ?? [];
  switch (metric) {
    case "raw_palette": return ["*.tsx", "*.jsx", "*.astro", "*.ts", ...extra];
    case "hex": return ["*.tsx", "*.jsx", "*.astro", "*.css", ...extra];
    case "arbitrary_color": return ["*.tsx", "*.jsx", "*.astro", "*.ts"];
    case "css_var_defs": return ["*.css"];
    case "local_primitive_count": return ["*.tsx", "*.jsx"];
    case "font_size_literal": return ["*.tsx", "*.jsx", "*.astro", "*.ts", "*.css", ...extra];
    case "size_literal": return ["*.tsx", "*.jsx", "*.astro", "*.ts", ...extra];
    case "native_control": return ["*.tsx", "*.jsx", "*.astro"];
    case "control_override": return ["*.tsx", "*.jsx"];
    case "page_heading": return ["*.tsx", "*.jsx", "*.astro"];
    case "shell_override": return ["*.tsx", "*.jsx", "*.css", ...extra];
    case "header_height_literal": return ["*.tsx", "*.jsx", "*.astro", "*.css", "*.vue", "*.svelte"];
    case "transcript_type_override": return ["*.tsx", "*.jsx", "*.css"];
    case "settings_layout": return ["*.tsx", "*.jsx", "*.astro"];
    case "imports": return ["*.tsx", "*.ts", "*.astro", "*.jsx"];
    default: return SRC_EXT;
  }
}

// Repository-locating variables set by hook runners would override `-C`; user config such as
// grep.column or color.ui would change the output format the parser reads.
const GIT_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR"].includes(k)));
const GIT_CONFIG = ["-c", "grep.column=false", "-c", "color.ui=never", "-c", "color.grep=never"];

function git(dir, args, { allowExit1 = false } = {}) {
  try {
    return execFileSync("git", [...GIT_CONFIG, "-C", dir, ...args], { encoding: "utf8", env: GIT_ENV, maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    if (allowExit1 && error.status === 1) return error.stdout ?? "";
    throw new Error(`git ${args.slice(0, 3).join(" ")} failed in ${dir}: ${(error.stderr || error.message).trim()}`);
  }
}

/**
 * A source to read: a git dir plus either a tree-ish (`rev`) or the working tree (`rev: null`,
 * tracked and untracked files that .gitignore does not exclude).
 */
function pathspecs(roots, exts) {
  // A plain pathspec "*" also matches "/", so `root/*.tsx` covers every depth under the root,
  // including files directly inside it.
  return roots.flatMap((root) => exts.map((e) => (root ? `${root}/${e}` : e)));
}

/** Every match of `pattern`: [{ path, line, match }]. */
export function grepMatches(source, roots, pattern, exts) {
  const args = ["grep", "-I", "-P", "-n", "-o", "--null", "-e", pattern];
  if (source.rev) args.push(source.rev);
  else args.push("--untracked");
  args.push("--", ...pathspecs(roots, exts), ...EXCLUDE);
  const prefix = source.rev ? `${source.rev}:` : "";
  const out = git(source.dir, args, { allowExit1: true });
  const rows = [];
  for (const record of out.split("\n")) {
    if (!record) continue;
    const [file, line, match] = record.split("\0");
    rows.push({ path: file.startsWith(prefix) ? file.slice(prefix.length) : file, line: Number(line), match });
  }
  return rows;
}

/** Files under `specs`, less the excluded paths, with a line matching the PCRE `pattern`. */
function grepFiles(source, pattern, specs) {
  const args = ["grep", "-I", "-P", "-l", "--null", "-e", pattern];
  if (source.rev) args.push(source.rev);
  else args.push("--untracked");
  args.push("--", ...specs, ...EXCLUDE);
  const prefix = source.rev ? `${source.rev}:` : "";
  return git(source.dir, args, { allowExit1: true }).split("\0").filter(Boolean)
    .map((f) => (f.startsWith(prefix) ? f.slice(prefix.length) : f).trim()).filter(Boolean);
}

/**
 * A file's text with its comments blanked, keeping offsets and newlines. Comments name things
 * without styling or importing them (a CSS note that mentions "transcript" or "header").
 */
function codeText(source, path) {
  const blank = (comment) => comment.replace(/[^\n]/g, " ");
  return readFile(source, path)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(^|[\s;{}(])\/\/[^\n]*/gm, (m, lead) => lead + blank(m.slice(lead.length)));
}

/** Every match of a multi-line metric: [{ path, line, match }], `line` being where the match starts. */
export function ruleMatches(source, roots, metric, exts) {
  const { prefilter, patterns } = RULE_PATTERNS[metric];
  const rows = [];
  for (const path of grepFiles(source, prefilter, pathspecs(roots, exts))) {
    const text = codeText(source, path);
    const found = new Map();
    for (const pattern of patterns) {
      for (const m of text.matchAll(new RegExp(pattern, "g"))) found.set(m.index, m[0]);
    }
    for (const [index, match] of [...found].sort(([a], [b]) => a - b)) {
      rows.push({ path, line: text.slice(0, index).split("\n").length, match });
    }
  }
  return rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.line - b.line));
}

/** A file name without its directory or extension. */
function baseName(path) {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
}

/** The words of a file name: `SettingsPortsCard.tsx` is settings, ports, card; `SSOSettings.tsx` is sso, settings. */
function fileWords(path) {
  return baseName(path).split(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|[^A-Za-z0-9]+/)
    .filter(Boolean).map((w) => w.toLowerCase());
}

/** A page file's route as path segments: no extension or trailing route, index, page or layout name. */
function routeSegments(path) {
  return path.toLowerCase().replace(/\.[^./]+$/, "").replace(/\/(?:route|index|page|layout)$/, "").split(/[/.]/);
}

/** Whether a page module renders the routes beneath it: a Next.js layout, or a routes module other than an index. */
function wrapsChildren(path) {
  const base = baseName(path).toLowerCase();
  if (/(?:^|\.)(?:_?index|page)$/.test(base)) return false;
  return base === "layout" || ROUTES_DIR.test(path);
}

/** Every page a page metric counts: [{ path, line: 1, match }], `match` saying why it counts. */
export function pageMatches(source, roots, metric, exts) {
  const { name, composes, reason } = PAGE_PATTERNS[metric];
  const isPage = (f) => {
    const words = fileWords(f);
    if (PAGE_DIR.test(f)) return !PAGE_PARTS.includes(words.at(-1));
    if (words.length === 1 && ["page", "layout"].includes(words[0])) return true;
    return words.includes(name) && words[0] !== "use" && [name, ...PAGE_WORDS].includes(words.at(-1));
  };
  const specs = pathspecs(roots, exts.map((e) => `*${name}${e}`)).map((s) => `:(icase)${s}`);
  const pages = grepFiles(source, "^", specs).filter(isPage).sort();
  const composing = new Set(pages.filter((f) => new RegExp(composes).test(codeText(source, f))));
  const layouts = [...composing].filter(wrapsChildren).map(routeSegments);
  const covered = (f) => {
    const route = routeSegments(f);
    return composing.has(f) || layouts.some((layout) => layout.every((segment, i) => route[i] === segment));
  };
  return pages.filter((f) => !covered(f)).map((path) => ({ path, line: 1, match: reason }));
}

/** Full text of matching lines in the named files, for failure reports. */
function grepLines(source, pattern, files) {
  const args = ["grep", "-I", "-P", "-n", "--null", "-e", pattern];
  if (source.rev) args.push(source.rev);
  else args.push("--untracked");
  args.push("--", ...files.map((f) => `:(literal)${f}`));
  const prefix = source.rev ? `${source.rev}:` : "";
  return git(source.dir, args, { allowExit1: true }).split("\n").filter(Boolean).map((record) => {
    const [file, line, text] = record.split("\0");
    return { path: file.startsWith(prefix) ? file.slice(prefix.length) : file, line: Number(line), text: text.trim() };
  });
}

function listFiles(source, roots) {
  const scope = roots.map((r) => r || ".");
  const out = source.rev
    ? git(source.dir, ["ls-tree", "-r", "--name-only", source.rev, "--", ...scope])
    : git(source.dir, ["ls-files", "--cached", "--others", "--exclude-standard", "--", ...scope]);
  return out.split("\n").filter(Boolean);
}

function readFile(source, path) {
  if (!source.rev) {
    const full = join(source.dir, path);
    return existsSync(full) ? readFileSync(full, "utf8") : "";
  }
  try {
    return execFileSync("git", ["-C", source.dir, "show", `${source.rev}:${path}`], { encoding: "utf8", env: GIT_ENV, maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function sortedObject(entries) {
  return Object.fromEntries([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function countBy(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

function pkgVersions(source, roots) {
  const found = new Map();
  const add = (key, value) => found.set(key, new Set([...(found.get(key) ?? []), value]));
  const paths = new Set(["package.json", ...roots.filter(Boolean).map((r) => `${r}/package.json`)]);
  for (const p of paths) {
    let pkg;
    try { pkg = JSON.parse(readFile(source, p)); } catch { continue; }
    for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
      for (const [name, version] of Object.entries(pkg[section] ?? {})) {
        if (SHARED.includes(name)) add(name.split("/")[1], version);
      }
    }
    for (const [name, version] of Object.entries(pkg.pnpm?.overrides ?? {})) {
      if (SHARED.some((s) => name.includes(s))) add(`override:${name.split("/").at(-1)}`, version);
    }
  }
  return sortedObject([...found].map(([k, v]) => [k, [...v].sort()]));
}

/** Measure one surface from `source`. `matches` holds the raw gated matches for reporting. */
export function measure(surface, source) {
  const { roots, extraExt } = SURFACES[surface];
  const files = listFiles(source, roots);
  const srcRe = extraExt ? /\.(tsx|jsx|astro|vue|svelte|js|html)$/ : /\.(tsx|jsx|astro|vue|svelte)$/;
  const tsxFiles = files.filter((f) => srcRe.test(f) && !/node_modules|test|spec|stories|fixtures|dist\//.test(f)).length;
  const cssFiles = files.filter((f) => f.endsWith(".css") && !f.includes("node_modules") && !f.includes("dist/")).length;

  const matches = {};
  const row = { repo: SURFACES[surface].repo, roots, branch: source.branch ?? null, head: source.head ?? null,
    tsx_files: tsxFiles, css_files: cssFiles, versions: pkgVersions(source, roots), importing_files: {} };
  for (const pkg of SHARED) {
    const escaped = pkg.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
    const hits = grepMatches(source, roots, String.raw`from ['"]${escaped}[/'"]`, extensions(surface, "imports"));
    row.importing_files[pkg.split("/")[1]] = new Set(hits.map((h) => h.path)).size;
  }
  row.by_file = {};
  for (const metric of GATED) {
    const exts = extensions(surface, metric);
    const hits = RULE_PATTERNS[metric] ? ruleMatches(source, roots, metric, exts)
      : PAGE_PATTERNS[metric] ? pageMatches(source, roots, metric, exts)
        : grepMatches(source, roots, PATTERNS[metric], exts);
    matches[metric] = hits;
    row[metric] = hits.length;
    row.by_file[metric] = sortedObject(countBy(hits.map((h) => h.path)));
  }
  row.palette_top = [...countBy(matches.raw_palette.map((m) => m.match))]
    .sort(([a, x], [b, y]) => y - x || (a < b ? -1 : 1)).slice(0, 6);
  row.local_primitives = sortedObject(countBy(matches.local_primitive_count.map((m) => m.match.match(LOCAL_PRIM_NAME)?.[1] ?? m.match)));
  return { row, matches };
}

/**
 * Compare a measured row with its baseline row. A metric the baseline row has not recorded
 * (one added after the row was written) is `unrecorded`, not a rise: it gates from the first
 * baseline that records it, so a consumer's own baseline file keeps passing until refreshed.
 */
export function compare(baseline, current) {
  const rises = [];
  const falls = [];
  const unrecorded = [];
  for (const metric of GATED) {
    const now = current[metric];
    if (baseline && typeof baseline[metric] !== "number") { unrecorded.push({ metric, now }); continue; }
    const base = baseline?.[metric] ?? 0;
    if (now > base) rises.push({ metric, base, now });
    else if (now < base) falls.push({ metric, base, now });
  }
  return { rises, falls, unrecorded };
}

/** Files whose count for `metric` rose above their baseline count, worst first. */
export function risenFiles(baseline, current, metric) {
  const before = baseline?.by_file?.[metric] ?? {};
  return Object.entries(current.by_file[metric])
    .map(([path, now]) => ({ path, base: before[path] ?? 0, now }))
    .filter((f) => f.now > f.base)
    .sort((a, b) => b.now - b.base - (a.now - a.base) || (a.path < b.path ? -1 : 1));
}

/**
 * Apply `rows` to `baseline`. Without allowRise, a row with any gated rise is refused and the
 * baseline keeps its old counts, but still records metrics that row had not recorded yet.
 * Returns { next, refused }.
 */
export function updateBaseline(baseline, rows, { allowRise = false } = {}) {
  const next = { ...baseline };
  const refused = [];
  for (const [surface, row] of Object.entries(rows)) {
    const { rises, unrecorded } = compare(baseline[surface], row);
    if (rises.length && !allowRise && baseline[surface]) {
      refused.push({ surface, rises });
      if (unrecorded.length) {
        const kept = { ...baseline[surface], by_file: { ...baseline[surface].by_file } };
        for (const { metric } of unrecorded) { kept[metric] = row[metric]; kept.by_file[metric] = row.by_file?.[metric] ?? {}; }
        next[surface] = kept;
      }
      continue;
    }
    next[surface] = row;
  }
  return { next: sortedBySurface(next), refused };
}

function sortedBySurface(baseline) {
  const order = Object.keys(SURFACES);
  return Object.fromEntries(Object.entries(baseline).sort(([a], [b]) => {
    const ia = order.indexOf(a); const ib = order.indexOf(b);
    return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib) || (a < b ? -1 : 1);
  }));
}

export function readBaseline(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

export function writeBaseline(path, baseline) {
  writeFileSync(path, `${JSON.stringify(baseline, null, 1)}\n`);
}

function cacheRoot() {
  return process.env.TANGLE_DRIFT_CACHE ?? join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "tangle-drift");
}

function remoteUrl(repo) {
  return `${process.env.TANGLE_DRIFT_REMOTE_PREFIX ?? "https://github.com/"}${repo}.git`;
}

const fetched = new Map();
/**
 * Shallow-fetch the default branch of `repo` into a bare partial clone in the cache. Blobs over
 * 256 KiB (images, fonts, media) stay on the server; `git grep` fetches one on demand only if a
 * source pathspec matches it.
 */
export function remoteSource(repo) {
  if (fetched.has(repo)) return fetched.get(repo);
  const url = remoteUrl(repo);
  const dir = join(cacheRoot(), `${repo.replace("/", "__")}.git`);
  // A directory left by an interrupted first run is re-initialised rather than letting `git -C`
  // fall through to an enclosing repository.
  if (!existsSync(join(dir, "HEAD"))) {
    mkdirSync(dir, { recursive: true });
    git(dir, ["init", "--bare", "--quiet"]);
  }
  git(dir, ["config", "remote.origin.url", url]);
  git(dir, ["config", "remote.origin.promisor", "true"]);
  git(dir, ["config", "remote.origin.partialclonefilter", "blob:limit=256k"]);
  const symref = git(dir, ["ls-remote", "--symref", "origin", "HEAD"]);
  const branch = symref.match(/^ref: refs\/heads\/(\S+)\s+HEAD/m)?.[1];
  if (!branch) throw new Error(`cannot resolve the default branch of ${url}`);
  const ref = `refs/remotes/origin/${branch}`;
  git(dir, ["fetch", "--quiet", "--depth", "1", "--no-tags", "--filter=blob:limit=256k", "origin", `+refs/heads/${branch}:${ref}`]);
  const source = { dir, rev: ref, branch, head: git(dir, ["rev-parse", ref]).trim().slice(0, 12) };
  fetched.set(repo, source);
  return source;
}

/** Read a local checkout: a tree-ish (default HEAD) or, with rev null, the working tree. */
export function localSource(repoDir, rev = "HEAD") {
  const dir = git(repoDir, ["rev-parse", "--show-toplevel"]).trim();
  const headRev = rev ?? "HEAD";
  const head = git(dir, ["rev-parse", "--verify", "--quiet", `${headRev}^{commit}`], { allowExit1: true }).trim().slice(0, 12) || null;
  const name = git(dir, ["rev-parse", "--abbrev-ref", headRev], { allowExit1: true }).trim();
  const branch = name && name !== "HEAD" && !/^[0-9a-f]{40}$/.test(name) ? name : null;
  return { dir, rev, branch, head: rev ? head : head && `${head}+worktree` };
}

function parseArgs(argv) {
  if (argv.includes("-h") || argv.includes("--help")) usage();
  const opts = { command: argv[0], surfaces: [], all: false, remote: false, repoDir: null, rev: "HEAD",
    worktree: false, baseline: DEFAULT_BASELINE, update: false, allowRise: false, json: false, top: 20 };
  for (let i = 1; i < argv.length; i++) {
    const flag = argv[i];
    const take = () => {
      const v = argv[++i];
      if (v === undefined) usage(`${flag} needs a value`);
      return v;
    };
    switch (flag) {
      case "--surface": opts.surfaces.push(take()); break;
      case "--all": opts.all = true; break;
      case "--remote": opts.remote = true; break;
      case "--repo-dir": opts.repoDir = take(); break;
      case "--rev": opts.rev = take(); break;
      case "--worktree": opts.worktree = true; break;
      case "--baseline": opts.baseline = take(); break;
      case "--update-baseline": opts.update = true; break;
      case "--allow-rise": opts.allowRise = true; break;
      case "--json": opts.json = true; break;
      case "--top": opts.top = Number(take()); break;
      default: usage(`unknown argument: ${flag}`);
    }
  }
  if (!["check", "scan"].includes(opts.command)) usage(opts.command ? `unknown command: ${opts.command}` : "name a command: check or scan");
  if (opts.all || (!opts.surfaces.length && opts.remote)) opts.surfaces = Object.keys(SURFACES);
  for (const s of opts.surfaces) if (!SURFACES[s]) usage(`unknown surface: ${s} (known: ${Object.keys(SURFACES).join(", ")})`);
  if (!opts.surfaces.length) usage("name a --surface, or pass --all");
  if (!!opts.repoDir === opts.remote) usage("pass exactly one of --repo-dir <path> or --remote");
  if (opts.repoDir && opts.surfaces.length > 1 && new Set(opts.surfaces.map((s) => SURFACES[s].repo)).size > 1) {
    usage("--repo-dir reads one repository; name surfaces from that repository only");
  }
  if (opts.allowRise && !opts.update) usage("--allow-rise only applies with --update-baseline");
  if (opts.update && opts.command !== "check") usage("--update-baseline only applies to check");
  // The shipped baseline records default branches; a local checkout may be a feature branch,
  // and writing into an installed package would silently relax that consumer's gate.
  if (opts.update && !opts.remote && opts.baseline === DEFAULT_BASELINE) usage("--update-baseline writes the shipped baseline only from --remote; pass --baseline <file> to write another");
  if (opts.update && opts.worktree) usage("--update-baseline cannot record uncommitted --worktree counts");
  if (opts.worktree && opts.rev !== "HEAD") usage("pass --rev or --worktree, not both");
  if (!Number.isInteger(opts.top) || opts.top < 0) usage("--top needs a non-negative integer");
  return opts;
}

export class UsageError extends Error {}

function usage(error) {
  const text = `Usage:
  tangle-drift check --surface <name> --repo-dir <path> [--rev <tree-ish> | --worktree]
  tangle-drift check --all --remote [--update-baseline [--allow-rise]]
  tangle-drift scan  (--surface <name>... | --all) (--repo-dir <path> | --remote) [--json]

  check   exit 1 when any gated count (${GATED.join(", ")}) is above the baseline
  scan    print the counts without comparing
  --repo-dir      read a local checkout at HEAD (or --rev), or its working tree with --worktree
  --remote        shallow-fetch each surface's default branch into ${cacheRoot()}
  --baseline      baseline file (default: the one shipped with @tangle-network/brand)
  --update-baseline  write measured rows; refuses rows that rise unless --allow-rise
Surfaces: ${Object.keys(SURFACES).join(", ")}
`;
  if (error) throw new UsageError(`${error}\n${text}`);
  throw Object.assign(new UsageError(text), { help: true });
}

function sourceFor(surface, opts) {
  if (opts.remote) return remoteSource(SURFACES[surface].repo);
  return localSource(opts.repoDir, opts.worktree ? null : opts.rev);
}

function describe(surface, row) {
  return `${surface} @ ${row.head ?? "?"}${row.branch ? ` (${row.branch})` : ""}: ` +
    GATED.map((m) => `${m}=${row[m]}`).join(" ");
}

export function main(argv = process.argv.slice(2), log = (s) => process.stdout.write(`${s}\n`)) {
  const opts = parseArgs(argv);
  const baseline = readBaseline(opts.baseline);
  const rows = {};
  const measured = {};
  for (const surface of opts.surfaces) {
    const source = sourceFor(surface, opts);
    measured[surface] = { ...measure(surface, source), source };
    rows[surface] = measured[surface].row;
  }
  if (opts.command === "scan") {
    if (opts.json) log(JSON.stringify(rows, null, 1));
    else for (const [s, row] of Object.entries(rows)) log(describe(s, row));
    return 0;
  }

  let failed = false;
  for (const [surface, { row, source, matches }] of Object.entries(measured)) {
    const base = baseline[surface];
    log(describe(surface, row));
    if (!base) {
      log(`  no baseline row for ${surface} in ${opts.baseline}`);
      if (!opts.update) failed = true;
      continue;
    }
    const { rises, falls, unrecorded } = compare(base, row);
    if (unrecorded.length) {
      log(`  not yet in this baseline (not gated): ${unrecorded.map((u) => `${u.metric}=${u.now}`).join(", ")}`);
      log("  record them with --update-baseline (the shipped baseline is refreshed in tangle-network/brand)");
    }
    for (const { metric, base: b, now } of rises) {
      log(`  FAIL ${metric}: ${now} > baseline ${b} (+${now - b}; baseline read ${base.head})`);
      const files = risenFiles(base, row, metric);
      const shown = files.length ? files : Object.entries(row.by_file[metric]).map(([path, now]) => ({ path, base: 0, now }))
        .sort((x, y) => y.now - x.now).slice(0, 10);
      log(files.length ? "  files above their baseline count:" : "  no single file rose (moved or renamed?); largest files:");
      for (const f of shown.slice(0, 10)) log(`    ${f.path}: ${f.base} -> ${f.now}`);
      const shownPaths = shown.slice(0, 10).map((f) => f.path);
      const lines = RULE_PATTERNS[metric] || PAGE_PATTERNS[metric]
        ? matches[metric].filter((m) => shownPaths.includes(m.path)).map((m) => ({ path: m.path, line: m.line, text: m.match.replace(/\s+/g, " ") }))
        : grepLines(source, PATTERNS[metric], shownPaths);
      for (const l of lines.slice(0, opts.top)) log(`    ${l.path}:${l.line}: ${l.text.slice(0, 160)}`);
      if (lines.length > opts.top) log(`    ... ${lines.length - opts.top} more lines`);
    }
    if (rises.length) failed = true;
    else if (falls.length) {
      log(`  ok, lower than baseline: ${falls.map((f) => `${f.metric} ${f.base} -> ${f.now}`).join(", ")}`);
      log("  once this reaches the default branch, lower the baseline in tangle-network/brand:");
      log(`    node packages/brand/bin/tangle-drift.mjs check --surface ${surface} --remote --update-baseline`);
    } else log("  ok, equal to baseline");
  }

  if (opts.update) {
    const { next, refused } = updateBaseline(baseline, rows, { allowRise: opts.allowRise });
    for (const r of refused) log(`  refused to raise ${r.surface}: ${r.rises.map((x) => `${x.metric} ${x.base} -> ${x.now}`).join(", ")} (pass --allow-rise to accept)`);
    writeBaseline(opts.baseline, next);
    log(`wrote ${opts.baseline}`);
    return refused.length ? 1 : 0;
  }
  return failed ? 1 : 0;
}

function invokedDirectly() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  try {
    process.exitCode = main();
  } catch (error) {
    if (error.help) process.stdout.write(error.message);
    else process.stderr.write(`tangle-drift: ${error.message}\n`);
    process.exitCode = error.help ? 0 : 2;
  }
}
