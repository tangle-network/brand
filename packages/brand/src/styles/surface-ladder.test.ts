import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn, blocksIn, contrastRatio, declIn, hexIn, hslIn, hslToRgb, oklchLightness } from "./css-test-utils";

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

  it("defaults the raised planes and shadows to the plain spine (wells: the canonical suite below)", () => {
    expect(declIn(body, "hsl-raised")).toBe("var(--hsl-card)");
    expect(declIn(body, "hsl-raised-2")).toBe("var(--hsl-card)");
    expect(declIn(body, "well")).toBe("var(--well-page)");
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
    const lightTint = css.match(/([^{}]*)\{\s*--ix-sel-bg:\s*hsl\(var\(--hsl-ring\) \/ 0\.13\);\s*--ix-hover-bg:\s*hsl\(var\(--hsl-ring\) \/ 0\.07\);[^{}]*\}/);
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

describe("Canonical surface ladder (every theme without its own ladder)", () => {
  // The spine's shared --bg-input sat +3.1 L above the dark page and -2.6 L under
  // the white card, so a field read as the plane it was on. The defaults derive
  // wells and the field border from each theme's own page, card, hairline and ink.
  const withWells = (selector: string) => {
    const block = blocksIn(tokens, selector).find((b) => /--well-page:/.test(b));
    if (!block) throw new Error(`no well defaults under ${selector}`);
    return block;
  };
  const defaults = withWells("[data-theme]");
  const lightDefaults = withWells('[data-theme$="-light"]');
  const DARK = blockIn(tokens, ".dark");
  const LIGHT = blockIn(tokens, ".light");

  type Rgb = [number, number, number];
  const toLab = (rgb: Rgb) => {
    const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const [r, g, b] = rgb.map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const fromLab = ([L, a, b]: number[]): Rgb => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const enc = (c: number) => 255 * Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
    return [enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
  };
  /** `color-mix(in oklab, a, b <t>)`. */
  const mix = (a: Rgb, b: Rgb, t: number) => fromLab(toLab(a).map((v, i) => v * (1 - t) + toLab(b)[i] * t));
  const spine = (css: string, token: string) => hslToRgb(hslIn(css, token)) as Rgb;

  it("declares the derivations this suite measures", () => {
    expect(declIn(defaults, "well-page")).toBe("color-mix(in oklab, hsl(var(--hsl-background)) 70%, black)");
    expect(declIn(defaults, "field-border")).toBe("color-mix(in oklab, hsl(var(--hsl-border)), hsl(var(--hsl-foreground)) 45%)");
    expect(declIn(lightDefaults, "well-page")).toBe("hsl(var(--hsl-card))");
    for (const token of ["well-card", "well-raised", "well-raised-2"]) {
      expect(declIn(defaults, token)).toBe("var(--well-page)");
      expect(declIn(lightDefaults, token)).toBe("hsl(var(--hsl-background))");
    }
  });

  it("recesses the dark well at least 4 L below the page and the card", () => {
    const well = mix(spine(DARK, "hsl-background"), [0, 0, 0], 0.3);
    expect(oklchLightness(spine(DARK, "hsl-background")) - oklchLightness(well)).toBeGreaterThanOrEqual(4);
    expect(oklchLightness(spine(DARK, "hsl-card")) - oklchLightness(well)).toBeGreaterThanOrEqual(10);
  });

  it("steps the light well 4 L or more off the page and the card", () => {
    const page = oklchLightness(spine(LIGHT, "hsl-background"));
    const card = oklchLightness(spine(LIGHT, "hsl-card"));
    expect(card - page).toBeGreaterThanOrEqual(4);
  });

  it.each([
    ["dark", () => DARK],
    ["light", () => LIGHT],
  ])("draws a field border that clears 3:1 on the card and the page in %s (WCAG 1.4.11)", (_mode, css) => {
    const border = mix(spine(css(), "hsl-border"), spine(css(), "hsl-foreground"), 0.45);
    expect(contrastRatio(border, spine(css(), "hsl-card")), "on the card").toBeGreaterThanOrEqual(3);
    expect(contrastRatio(border, spine(css(), "hsl-background")), "on the page").toBeGreaterThanOrEqual(3);
  });
});
