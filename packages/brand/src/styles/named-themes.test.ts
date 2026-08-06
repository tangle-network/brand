import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  blockIn,
  blocksIn,
  contrastRatio,
  declIn,
  hexIn,
  hexRelativeLuminanceIn,
  hslIn,
  hslToRgb,
} from "./css-test-utils";

/**
 * The named-theme contract.
 *
 * A named theme re-skins the SURFACE ladder and nothing else — the Tangle accent
 * (primary / ring / accent-text) stays put, so a product carries its identity in
 * its planes, not by inventing a second brand colour. These assertions live here
 * rather than in the consuming app because the palette lives here: an app's job
 * is only to opt in.
 */
const themes = readFileSync(
  path.resolve(import.meta.dirname, "named-themes.css"),
  "utf8",
);
const tokens = readFileSync(
  path.resolve(import.meta.dirname, "tokens.css"),
  "utf8",
);

// The canonical dark spine, anchored on the LAST selector of its multi-selector
// header (`:root, [data-sandbox-ui], [data-theme="dark"], .dark {`) — the same
// trick tokens.test.ts uses.
const CANON = blockIn(tokens, ".dark");

function block(selector: string): string {
  return blockIn(themes, selector);
}

describe('named theme: .dark[data-theme="intelligence"]', () => {
  const css = block('.dark[data-theme="intelligence"]');

  it("retints the surface canvas to violet", () => {
    for (const token of ["background", "card", "popover", "muted", "border"]) {
      const { h } = hslIn(css, `hsl-${token}`);
      expect(h, `--hsl-${token} hue`).toBeGreaterThanOrEqual(255);
      expect(h, `--hsl-${token} hue`).toBeLessThanOrEqual(268);
    }
  });

  it("reads as graded depth, not mud: lightness rises, saturation tapers, hue locked", () => {
    const ladder = ["hsl-background", "hsl-card", "hsl-secondary"].map((t) =>
      hslIn(css, t),
    );
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].l, `step ${i} lightness must rise`).toBeGreaterThan(
        ladder[i - 1].l,
      );
      expect(
        ladder[i].s,
        `step ${i} saturation must not rise as it lightens`,
      ).toBeLessThanOrEqual(ladder[i - 1].s);
    }
  });

  it("never recolors the Tangle accent — surfaces carry the identity, not the brand", () => {
    for (const token of ["--hsl-primary", "--hsl-ring", "--accent-text"]) {
      expect(css, `${token} must not be overridden by a named theme`).not.toContain(
        `${token}:`,
      );
    }
  });

  it("is dark-only — the SELECTOR enforces it, not the caller", () => {
    // An unscoped `[data-theme="intelligence"]` would repaint every surface with
    // the violet dark ramp if a consumer left the attribute on while switching to
    // light. The `.dark` requirement makes that impossible.
    //
    // Checked against the RULES, not the raw file: prose in a comment may well
    // spell the selector out, and a doc edit must not be able to fail this.
    const rules = themes.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).toContain('.dark[data-theme="intelligence"]');
    expect(rules).not.toMatch(/(?<!\.dark)\[data-theme="intelligence"\]/);
    // No light variant: light falls through to brand's canonical light spine.
    expect(rules).not.toContain('[data-theme="intelligence-light"]');
  });
});


describe('named theme: [data-theme="tangle-dark"]', () => {
  const css = block('[data-theme="tangle-dark"]');
  // `[data-theme="tangle-light"]` heads two rules — the shared light-status
  // override group AND the theme's own block; the theme block is the one that
  // declares the spine.
  const light = blocksIn(themes, '[data-theme="tangle-light"]').find((b) =>
    b.includes("--hsl-background"),
  );
  if (!light) throw new Error('missing theme block: [data-theme="tangle-light"]');

  it("IS the canonical dark spine, named — no drift from tokens.css", () => {
    // tangle-dark exists so the attribute can NAME the default spine (a dark
    // island in a light-named wrapper, a picker's explicit selection). If its
    // values diverge from :root, "tangle dark" becomes two palettes.
    const hslTokens = [
      "hsl-background",
      "hsl-foreground",
      "hsl-card",
      "hsl-card-foreground",
      "hsl-popover",
      "hsl-popover-foreground",
      "hsl-primary",
      "hsl-primary-foreground",
      "hsl-secondary",
      "hsl-muted",
      "hsl-muted-foreground",
      "hsl-accent",
      "hsl-border",
      "hsl-input",
      "hsl-ring",
    ];
    for (const token of hslTokens) {
      expect(hslIn(css, token), `--${token} must equal the :root dark spine`).toEqual(
        hslIn(CANON, token),
      );
    }
    const hexTokens = [
      "depth-1",
      "depth-2",
      "depth-3",
      "depth-4",
      "md3-surface-container-lowest",
      "md3-surface-container-low",
      "md3-surface-container",
      "md3-surface-container-high",
      "md3-surface-container-highest",
      "md3-outline-variant",
      "accent-text",
      "brand-primary",
      "brand-glow",
      "text-primary",
      "text-secondary",
      "text-muted",
      "text-dim",
    ];
    for (const token of hexTokens) {
      expect(hexIn(css, token), `--${token} must equal the :root dark spine`).toEqual(
        hexIn(CANON, token),
      );
    }
    // Aliased and rgba declarations don't fit hslIn/hexIn — compare them raw.
    for (const token of [
      "bg-root",
      "bg-card",
      "bg-input",
      "border-subtle",
      "border-default",
      "border-hover",
    ]) {
      expect(declIn(css, token), `--${token} must equal the :root dark spine`).toBe(
        declIn(CANON, token),
      );
    }
  });

  it("shares tangle-light's indigo hue family — same brand, dark register", () => {
    for (const token of ["hsl-primary", "hsl-ring", "hsl-background"]) {
      const dark = hslIn(css, token);
      const lite = hslIn(light, token);
      expect(
        Math.abs(dark.h - lite.h),
        `--${token} hue must sit within 10 of tangle-light's`,
      ).toBeLessThanOrEqual(10);
    }
  });

  it("tints its neutrals with the hue — nothing achromatic", () => {
    for (const token of [
      "hsl-background",
      "hsl-card",
      "hsl-popover",
      "hsl-secondary",
      "hsl-muted",
      "hsl-accent",
      "hsl-border",
      "hsl-input",
    ]) {
      const { h, s } = hslIn(css, token);
      expect(h, `--${token} hue in the indigo band`).toBeGreaterThanOrEqual(220);
      expect(h, `--${token} hue in the indigo band`).toBeLessThanOrEqual(250);
      expect(s, `--${token} is hue-tinted, not dead grey`).toBeGreaterThan(5);
    }
  });

  it("elevates by lightening, never darkening", () => {
    const planes = ["depth-1", "depth-2", "depth-3", "depth-4"].map((t) =>
      hexRelativeLuminanceIn(css, t),
    );
    for (let i = 1; i < planes.length; i++) {
      expect(planes[i], `depth step ${i} must be brighter than the one below`).toBeGreaterThan(
        planes[i - 1],
      );
    }
    const ladder = ["hsl-background", "hsl-card", "hsl-popover"].map(
      (t) => hslIn(css, t).l,
    );
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i], `step ${i} lightness must rise`).toBeGreaterThan(
        ladder[i - 1],
      );
    }
  });

  it("holds the dark contrast discipline — AA floors, AAA ink", () => {
    const canvas = hslToRgb(hslIn(css, "hsl-background"));
    const card = hslToRgb(hslIn(css, "hsl-card"));
    const fg = hslToRgb(hslIn(css, "hsl-foreground"));
    expect(contrastRatio(fg, canvas), "ink on canvas").toBeGreaterThanOrEqual(7);
    expect(contrastRatio(fg, card), "ink on card").toBeGreaterThanOrEqual(7);

    const muted = hslToRgb(hslIn(css, "hsl-muted-foreground"));
    expect(contrastRatio(muted, card), "muted ink on card").toBeGreaterThanOrEqual(
      4.5,
    );

    const primary = hslToRgb(hslIn(css, "hsl-primary"));
    const onPrimary = hslToRgb(hslIn(css, "hsl-primary-foreground"));
    expect(
      contrastRatio(onPrimary, primary),
      "the fill indigo carries white",
    ).toBeGreaterThanOrEqual(4.5);

    // The ring is NON-TEXT: it must clear 3:1 against both planes it sits on.
    const ring = hslToRgb(hslIn(css, "hsl-ring"));
    expect(contrastRatio(ring, canvas), "ring on canvas").toBeGreaterThanOrEqual(3);
    expect(contrastRatio(ring, card), "ring on card").toBeGreaterThanOrEqual(3);

    expect(
      contrastRatio(hexIn(css, "accent-text"), card),
      "bright indigo accent text on card",
    ).toBeGreaterThanOrEqual(4.5);

    // The faintest tier is still TEXT: it clears the body floor on both planes.
    const dim = hexIn(css, "text-dim");
    expect(contrastRatio(dim, card), "text-dim on card").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dim, canvas), "text-dim on canvas").toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("keeps the dark-tuned :root status palette instead of redeclaring it", () => {
    // Same contract as aubergine/arena: dark named themes inherit status from the
    // dark spine, so there is exactly one dark status palette to tune. What must
    // be proven is that the inherited pairs pass AA on their dark surfaces.
    expect(css).not.toMatch(/--surface-(success|warning|danger|info)-/);
    for (const name of ["success", "warning", "danger", "info"]) {
      const text = hexIn(CANON, `surface-${name}-text`);
      const bg = hexIn(CANON, `surface-${name}-bg`);
      expect(
        contrastRatio(text, bg),
        `inherited ${name} status text on its dark surface`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
