import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn, contrastRatio, declIn, hexIn, hslIn, hslToRgb, oklchLightness } from "./css-test-utils";

/**
 * The surface ladder and the interaction palette.
 *
 * A card, a card in a card and a field each need their own step from the plane
 * they sit on, or the page reads as one flat sheet with text on it: that was
 * Hospitality's "everything is on the same background" and "the search bar is
 * the same colour as the background". The ladder is specified in OKLCH
 * lightness (x100); the numbers below are ROOT-SPEC section (a), and a change
 * to them is a design decision, not a refactor.
 */
const read = (name: string) => readFileSync(path.resolve(import.meta.dirname, name), "utf8");
const tokens = read("tokens.css");
const themes = read("named-themes.css");
const rules = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const light = blockIn(themes, '[data-theme="hospitality"]:where(:not(.dark))');
const dark = blockIn(themes, '.dark[data-theme="hospitality"]');

/** A token as RGB, whether it is declared as an `H S% L%` triple or a hex. */
function rgbOf(css: string, token: string) {
  return /^#/.test(declIn(css, token)) ? hexIn(css, token) : hslToRgb(hslIn(css, token));
}
const L = (css: string, token: string) => oklchLightness(rgbOf(css, token));

const ladder: Array<[role: string, token: string, light: number, dark: number]> = [
  ["page", "hsl-background", 91.6, 16.9],
  ["sidebar", "sidebar-background", 96.9, 21.6],
  ["card", "hsl-card", 100, 31.1],
  ["raised", "hsl-raised", 95.6, 37.9],
  ["raised-2", "hsl-raised-2", 100, 43.9],
  ["popover", "hsl-popover", 100, 42.0],
  ["well on page", "well-page", 100, 12.4],
  ["well in card", "well-card", 94.9, 12.4],
  ["well in raised", "well-raised", 100, 22.1],
  ["well in raised-2", "well-raised-2", 94.9, 22.1],
  ["hairline", "hsl-border", 85.0, 42.0],
  ["field border", "field-border", 60.0, 64.0],
];

describe("Hospitality surface ladder", () => {
  for (const [role, token, lightL, darkL] of ladder) {
    it(`${role} (--${token}) lands at L ${lightL} light / ${darkL} dark`, () => {
      expect(L(light, token)).toBeCloseTo(lightL, 0);
      expect(L(dark, token)).toBeCloseTo(darkL, 0);
    });
  }

  // Each plane against the one it is placed on. 3 points is the probe's
  // flat-on-parent threshold; every step here clears 4.4.
  const steps: Array<[child: string, parent: string]> = [
    ["sidebar-background", "hsl-background"],
    ["hsl-card", "hsl-background"],
    ["hsl-raised", "hsl-card"],
    ["hsl-raised-2", "hsl-raised"],
    ["well-page", "hsl-background"],
    ["well-card", "hsl-card"],
    ["well-raised", "hsl-raised"],
    ["well-raised-2", "hsl-raised-2"],
  ];
  it.each([
    ["light", light],
    ["dark", dark],
  ])("never puts a plane or a well within 3 L points of its parent in %s", (_mode, css) => {
    for (const [child, parent] of steps) {
      expect(Math.abs(L(css, child) - L(css, parent)), `${child} on ${parent}`).toBeGreaterThanOrEqual(4.4);
    }
  });

  it("sinks every dark well below the plane it sits on", () => {
    for (const [well, parent] of steps.filter(([child]) => child.startsWith("well"))) {
      expect(L(dark, well), `${well} under ${parent}`).toBeLessThan(L(dark, parent));
    }
  });

  it("separates the dark card from the page at about 1.5:1", () => {
    expect(contrastRatio(rgbOf(dark, "hsl-card"), rgbOf(dark, "hsl-background"))).toBeGreaterThanOrEqual(1.45);
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ])("draws a field border that clears 3:1 against the card and the well in %s (WCAG 1.4.11)", (_mode, css) => {
    const border = rgbOf(css, "field-border");
    expect(contrastRatio(border, rgbOf(css, "hsl-card")), "on the card").toBeGreaterThanOrEqual(3);
    expect(contrastRatio(border, rgbOf(css, "well-card")), "on the well in a card").toBeGreaterThanOrEqual(3);
    expect(declIn(css, "border-strong")).toBe(declIn(css, "field-border"));
  });

  it.each([
    ["light", light, 4.5],
    ["dark", dark, 4.5],
  ])("keeps muted text readable from the page up to the popover in %s", (_mode, css, floor) => {
    const muted = rgbOf(css, "hsl-muted-foreground");
    for (const plane of ["hsl-background", "hsl-card", "hsl-raised", "hsl-popover"]) {
      expect(contrastRatio(muted, rgbOf(css, plane)), `muted on ${plane}`).toBeGreaterThanOrEqual(floor);
    }
    expect(declIn(css, "text-dim")).toBe(declIn(css, "text-muted"));
  });

  it("lifts dark raised planes with a top highlight and leaves light planes to the shadow", () => {
    expect(declIn(dark, "edge-highlight")).toBe("inset 0 1px 0 rgba(255, 255, 255, 0.06)");
    expect(declIn(light, "edge-highlight")).toBe("0 0 0 0 transparent");
    for (const css of [light, dark]) {
      for (const token of ["shadow-card", "shadow-raised", "shadow-well"]) {
        expect(declIn(css, token), `--${token}`).not.toBe("none");
      }
    }
  });
});

describe("Hospitality status surfaces (StatusPill tones)", () => {
  // ROOT-SPEC section (c). A status box must never read as a flat card: light
  // fills sit at L 91-93, at least 7 under the white card; dark fills at L 37-38,
  // about 6 over the card (the specified fills measure 5.9-6.8). Hue stays the
  // meaning.
  const hue = ([r, g, b]: [number, number, number]) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  const families: Record<string, (h: number) => boolean> = {
    success: (h) => h >= 100 && h <= 170,
    warning: (h) => h >= 25 && h <= 50,
    danger: (h) => h <= 10 || h >= 350,
    neutral: () => true,
  };
  for (const tone of ["success", "warning", "danger", "neutral"]) {
    it.each([
      ["light", light],
      ["dark", dark],
    ])(`${tone}: text clears 5:1 on its fill, and the fill steps off the card, in %s`, (mode, css) => {
      const bg = hexIn(css, `surface-${tone}-bg`);
      const text = hexIn(css, `surface-${tone}-text`);
      expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(5);
      const step = oklchLightness(bg) - L(css, "hsl-card");
      if (mode === "light") {
        expect(oklchLightness(bg)).toBeGreaterThanOrEqual(90.5);
        expect(oklchLightness(bg)).toBeLessThanOrEqual(93.5);
        expect(step).toBeLessThanOrEqual(-7);
      } else {
        expect(oklchLightness(bg)).toBeGreaterThanOrEqual(36.5);
        expect(oklchLightness(bg)).toBeLessThanOrEqual(38.5);
        expect(step).toBeGreaterThanOrEqual(5.8);
      }
      expect(families[tone]!(hue(text)), `${tone} text hue ${hue(text).toFixed(0)}`).toBe(true);
      hexIn(css, `surface-${tone}-border`);
    });
  }
});

describe("shared surface context and interaction tokens (tokens.css)", () => {
  const css = rules(tokens);
  const shared = css.match(/([^{}]*)\{\s*--hsl-raised:[^}]*\}/);
  const body = shared?.[0] ?? "";

  it("is declared on every scope that can redefine the ring or the ladder", () => {
    expect(shared, "the shared surface rule").not.toBeNull();
    for (const scope of [":root", ".dark", ".light", "[data-sandbox-ui]", "[data-sandbox-theme]", "[data-theme]"]) {
      expect(shared![1]).toContain(scope);
    }
  });

  it("defaults every new ladder token to the plain spine, so other themes look as they did", () => {
    expect(declIn(body, "hsl-raised")).toBe("var(--hsl-card)");
    expect(declIn(body, "hsl-raised-2")).toBe("var(--hsl-card)");
    for (const well of ["well-page", "well-card", "well-raised", "well-raised-2"]) {
      expect(declIn(body, well)).toBe("var(--bg-input)");
    }
    expect(declIn(body, "well")).toBe("var(--well-page)");
    expect(declIn(body, "field-border")).toBe("hsl(var(--hsl-border))");
    expect(declIn(body, "shadow-raised")).toBe("var(--shadow-card)");
    // A shadow token joins a comma list; "none" would void the list.
    expect(declIn(body, "shadow-well")).toBe("0 0 0 0 transparent");
    expect(declIn(body, "edge-highlight")).toBe("0 0 0 0 transparent");
  });

  it("derives the four interaction states from the focus ring at the specified alphas", () => {
    expect(declIn(body, "ix-hover")).toBe("0 0 0 1px hsl(var(--hsl-ring) / 0.45), 0 0 0 4px hsl(var(--hsl-ring) / 0.16)");
    expect(declIn(body, "ix-hover-border")).toBe("hsl(var(--hsl-ring) / 0.7)");
    expect(declIn(body, "ix-press")).toBe("0 0 0 1px hsl(var(--hsl-ring) / 0.95), 0 0 0 4px hsl(var(--hsl-ring) / 0.3)");
    expect(declIn(body, "ix-after")).toBe("0 0 0 1px hsl(var(--hsl-ring) / 0.6), 0 0 0 3px hsl(var(--hsl-ring) / 0.14)");
    expect(declIn(body, "ix-sel-ring")).toBe("hsl(var(--hsl-ring) / 0.85)");
    expect(declIn(body, "ix-sel-bg")).toBe("hsl(var(--hsl-ring) / 0.18)");
    expect(declIn(body, "ix-hover-bg")).toBe("hsl(var(--hsl-ring) / 0.08)");
    const lightTint = css.match(/([^{}]*)\{\s*--ix-sel-bg:\s*hsl\(var\(--hsl-ring\) \/ 0\.13\);\s*--ix-hover-bg:\s*hsl\(var\(--hsl-ring\) \/ 0\.07\);\s*\}/);
    expect(lightTint, "light tint override").not.toBeNull();
    expect(lightTint![1]).toContain('[data-theme="hospitality"]:where(:not(.dark))');
    expect(lightTint![1]).toContain(".light");
  });

  it("re-declares --card and --well per card level, keyed only on the Card primitive", () => {
    const level = (selector: string) => blockIn(tokens, selector);
    const one = level('[data-slot="card"] :where(*)');
    expect(declIn(one, "card")).toBe("var(--hsl-raised)");
    expect(declIn(one, "well")).toBe("var(--well-card)");
    const two = level('[data-slot="card"] [data-slot="card"] :where(*)');
    expect(declIn(two, "card")).toBe("var(--hsl-raised-2)");
    expect(declIn(two, "well")).toBe("var(--well-raised)");
    const three = level('[data-slot="card"] [data-slot="card"] [data-slot="card"] :where(*)');
    expect(declIn(three, "well")).toBe("var(--well-raised-2)");
    // Never an app class: the rule is the brand's, the adoption is the Card's.
    const contextSelectors = [...css.matchAll(/([^{}]*\[data-slot="card"\][^{}]*)\{/g)].map((m) => m[1]);
    expect(contextSelectors.length).toBe(3);
    for (const selector of contextSelectors) expect(selector).not.toMatch(/\.[a-z]/);
  });

  it("declares every ladder token in both Hospitality modes", () => {
    for (const css of [light, dark]) {
      for (const token of [
        "hsl-raised", "hsl-raised-2", "well-page", "well-card", "well-raised", "well-raised-2",
        "field-border", "edge-highlight", "shadow-card", "shadow-raised", "shadow-well",
      ]) {
        expect(css, `--${token}`).toMatch(new RegExp(`--${token}:`));
      }
    }
  });
});
