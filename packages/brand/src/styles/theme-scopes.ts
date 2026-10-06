import { readFileSync } from "node:fs";
import path from "node:path";
import { blockIn, blocksIn, hslToRgb } from "./css-test-utils";

/**
 * Every theme scope a consumer can select, each with its CSS sources listed
 * from the most specific to the baseline it inherits from, and a resolver that
 * follows `var()` and `hsl(var())` through them the way the cascade does.
 * Contrast suites iterate these so a new named theme cannot skip a check.
 */
const read = (name: string) =>
  readFileSync(path.resolve(import.meta.dirname, name), "utf8");
const tokens = read("tokens.css");
export const themes = read("named-themes.css");
const legacy = read("legacy-light.css");
const system = read("system.css");
const ladders = read("ladders.css");

/** The spine block of a selector: the rule that declares the surface ladder. */
function spine(source: string, selector: string): string {
  const block = blocksIn(source, selector).find((b) => b.includes("--hsl-background:"));
  if (!block) throw new Error(`missing spine block: ${selector}`);
  return block;
}

const DARK = spine(tokens, ".dark");
const LIGHT = spine(tokens, ".light");
// The shared light-ink group that also lists every named light theme.
const LIGHT_INK = blocksIn(themes, '[data-theme="agents-light"]').find(
  (b) => !b.includes("--hsl-background:"),
);
if (!LIGHT_INK) throw new Error("missing the shared named-light ink group");

const named = (selector: string) => spine(themes, selector);

/**
 * Each scope lists its sources from the most specific to the baseline it
 * inherits from, as the cascade resolves them.
 */
export const scopes: Array<{ name: string; sources: string[] }> = [
  { name: "canonical dark", sources: [DARK] },
  { name: "canonical light", sources: [LIGHT, DARK] },
  {
    name: "legacy-light default",
    sources: [spine(legacy, ":where(:root)"), spine(legacy, ".dark")],
  },
  {
    name: "system dark",
    sources: [spine(system, ".dark"), blockIn(ladders, ".dark")],
  },
  {
    name: "system light",
    sources: [
      spine(system, ".light"),
      blockIn(ladders, ".light"),
      spine(system, ".dark"),
      blockIn(ladders, ".dark"),
    ],
  },
  ...["aubergine", "arena", "super", "tangle-dark", "agents"].map((name) => ({
    name,
    sources: [named(`[data-theme="${name}"]`), DARK],
  })),
  ...["aubergine-light", "arena-light", "super-light", "tangle-light", "agents-light"].map(
    (name) => ({
      name,
      sources: [named(`[data-theme="${name}"]`), LIGHT_INK, LIGHT, DARK],
    }),
  ),
  { name: "intelligence", sources: [named('.dark[data-theme="intelligence"]'), DARK] },
  {
    name: "hospitality light",
    sources: [named('[data-theme="hospitality"]:where(:not(.dark))'), LIGHT, DARK],
  },
  { name: "hospitality dark", sources: [named('.dark[data-theme="hospitality"]'), DARK] },
  {
    name: "website light",
    sources: [named('[data-theme="website"]:where(:not(.dark))'), LIGHT, DARK],
  },
  { name: "website dark", sources: [named('.dark[data-theme="website"]'), DARK] },
];

export type Rgb = [number, number, number];

/**
 * Resolve a token to RGB through the scope's sources, following `var()` and
 * `hsl(var())` references the way the cascade would: from the first source that
 * declares each name.
 */
export function resolve(sources: string[], token: string): Rgb {
  const raw = sources
    .map((css) => css.match(new RegExp(`(?<![\\w-])--${token}:\\s*([^;]+);`))?.[1]?.trim())
    .find((value) => value !== undefined);
  if (raw === undefined) throw new Error(`--${token} resolves to nothing`);

  const ref = /^(?:hsl\()?var\(--([a-z0-9-]+)\)\)?$/.exec(raw);
  if (ref) return resolve(sources, ref[1]);
  const hex = /^#([0-9a-fA-F]{6})\b/.exec(raw);
  if (hex) {
    return [0, 2, 4].map((i) => Number.parseInt(hex[1].slice(i, i + 2), 16)) as Rgb;
  }
  const hsl = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(raw);
  if (hsl) return hslToRgb({ h: Number(hsl[1]), s: Number(hsl[2]), l: Number(hsl[3]) });
  throw new Error(`--${token} has an unreadable value: ${raw}`);
}
