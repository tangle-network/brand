import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  blockIn,
  blocksIn,
  compositeOver,
  contrastRatio,
  hexIn,
  hslIn,
  hslToRgb,
} from "./css-test-utils";

/**
 * The focus palette's contract.
 *
 * A focused field keeps a 1px border in --focus-border with a soft
 * --focus-halo outside it. The halo is too faint to count as an indicator on
 * its own, so the BORDER must clear the 3:1 non-text floor (WCAG 1.4.11)
 * against the field it outlines, in every theme a consumer can select.
 */
const read = (name: string) =>
  readFileSync(path.resolve(import.meta.dirname, name), "utf8");
const tokens = read("tokens.css");
const themes = read("named-themes.css");

// The focus rule is the one whose selector list ends in `[data-theme]`.
const FOCUS = blockIn(tokens, "[data-theme]");
const DARK = blockIn(tokens, ".dark");
const LIGHT = blockIn(tokens, ".light");

function alphaOf(token: string, pattern: RegExp): number {
  const m = FOCUS.match(pattern);
  if (!m) throw new Error(`--${token} does not have the expected shape`);
  return Number(m[1]) / (m[2] === "%" ? 100 : 1);
}
const borderAlpha = alphaOf(
  "focus-border",
  /--focus-border:\s*hsl\(var\(--hsl-ring\)\s*\/\s*([\d.]+)()\)/,
);
const dangerAlpha = alphaOf(
  "focus-border-danger",
  /--focus-border-danger:\s*color-mix\(in srgb, var\(--surface-danger-text\) ([\d.]+)(%), transparent\)/,
);

/** Reads a token from the first source that declares it, as the cascade would. */
function effective<T>(sources: string[], readToken: (css: string) => T): T {
  for (const css of sources) {
    try {
      return readToken(css);
    } catch {
      // Not declared here; fall through to the scope it inherits from.
    }
  }
  throw new Error("token resolves to nothing");
}

const lightStatus = blocksIn(themes, '[data-theme="tangle-light"]').join("\n");
const scopes: Array<{ name: string; sources: string[] }> = [
  { name: "canonical dark", sources: [DARK] },
  { name: "canonical light", sources: [LIGHT] },
  ...["aubergine", "arena", "tangle-dark"].map((name) => ({
    name,
    sources: [...blocksIn(themes, `[data-theme="${name}"]`), DARK],
  })),
  ...["aubergine-light", "arena-light", "tangle-light"].map((name) => ({
    name,
    sources: [...blocksIn(themes, `[data-theme="${name}"]`), lightStatus, DARK],
  })),
  {
    name: "intelligence",
    sources: [blockIn(themes, '.dark[data-theme="intelligence"]'), DARK],
  },
];

describe("the focus palette resolves in every theme scope", () => {
  it("is declared on each selector that can redefine the tokens it derives from", () => {
    // A custom property that references another is resolved where it is
    // declared. Declared on :root alone, a named theme on a descendant would
    // inherit the root's focus colors instead of its own.
    const rules = tokens.replace(/\/\*[\s\S]*?\*\//g, "");
    const header = rules.match(/([^{}]*)\{\s*--focus-border:/)?.[1] ?? "";
    for (const scope of [":root", ".dark", ".light", "[data-sandbox-ui]", "[data-sandbox-theme]", "[data-theme]"]) {
      expect(header, `focus rule selector list`).toContain(scope);
    }
  });
});

describe("a focused field's border clears 3:1 against the field", () => {
  for (const { name, sources } of scopes) {
    it(name, () => {
      const field = hslToRgb(effective(sources, (css) => hslIn(css, "hsl-card")));
      const ring = hslToRgb(effective(sources, (css) => hslIn(css, "hsl-ring")));
      const border = compositeOver(ring, field, borderAlpha);
      expect(contrastRatio(border, field), "focus border on field").toBeGreaterThanOrEqual(3);

      const danger = effective(sources, (css) => hexIn(css, "surface-danger-text"));
      const dangerBorder = compositeOver(danger, field, dangerAlpha);
      expect(contrastRatio(dangerBorder, field), "danger focus border on field").toBeGreaterThanOrEqual(3);
    });
  }
});
