import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn, blocksIn, contrastRatio, hslToRgb } from "./css-test-utils";

/**
 * The token pairs @tangle-network/ui's Switch is drawn with.
 *
 * A switch is non-text content, so WCAG 1.4.11 asks 3:1 for the parts that show
 * its state: the track's edge against the surface it sits on, and the thumb
 * against the track. Off is a muted-foreground outline and thumb on the
 * surface. On is an accent-text track carrying a card-coloured thumb, so the
 * thumb-on-track pair is the same pair as track-on-card, inverted. The primary
 * fill cannot do this job: it is tuned to carry white text and measures about
 * 2.4:1 on the dark card and canvas.
 *
 * These are text tokens, held to 4.5:1 elsewhere for SOME themes; this suite
 * asserts the 3:1 the Switch depends on in EVERY scope a consumer can select.
 */
const read = (name: string) =>
  readFileSync(path.resolve(import.meta.dirname, name), "utf8");
const tokens = read("tokens.css");
const themes = read("named-themes.css");
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
const scopes: Array<{ name: string; sources: string[] }> = [
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

type Rgb = [number, number, number];

/**
 * Resolve a token to RGB through the scope's sources, following `var()` and
 * `hsl(var())` references the way the cascade would: from the first source that
 * declares each name.
 */
function resolve(sources: string[], token: string): Rgb {
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

describe("the Switch's token pairs clear 3:1 in every theme scope", () => {
  it("covers every named theme", () => {
    const rules = themes.replace(/\/\*[\s\S]*?\*\//g, "");
    const declared = new Set([...rules.matchAll(/\[data-theme="([a-z-]+)"\]/g)].map((m) => m[1]));
    // Hospitality and website take their mode from .dark, so one name covers two scopes.
    const covered = new Set(scopes.map((s) => s.name.replace(/ (light|dark)$/, "")));
    for (const name of declared) {
      expect(covered.has(name), `[data-theme="${name}"] needs a scope here`).toBe(true);
    }
  });

  for (const { name, sources } of scopes) {
    it(name, () => {
      const card = resolve(sources, "hsl-card");
      const canvas = resolve(sources, "hsl-background");
      const accentText = resolve(sources, "accent-text");
      const mutedFg = resolve(sources, "hsl-muted-foreground");

      // On: the accent-text track against the surface, and the card thumb on it.
      expect(contrastRatio(accentText, card), "on track on card / card thumb on track").toBeGreaterThanOrEqual(3);
      expect(contrastRatio(accentText, canvas), "on track on canvas").toBeGreaterThanOrEqual(3);
      // Off: the muted-foreground outline and thumb against the surface.
      expect(contrastRatio(mutedFg, card), "off outline on card").toBeGreaterThanOrEqual(3);
      expect(contrastRatio(mutedFg, canvas), "off outline on canvas").toBeGreaterThanOrEqual(3);
    });
  }
});
