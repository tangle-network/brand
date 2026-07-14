import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn } from "./css-test-utils";

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
  path.resolve(import.meta.dirname, "themes.css"),
  "utf8",
);

function block(selector: string): string {
  return blockIn(themes, selector);
}

/** brand HSL slots are stored as "<H> <S>% <L>%". */
function hsl(css: string, token: string): { h: number; s: number; l: number } {
  const m = css.match(
    new RegExp(`--${token}:\\s*(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)%\\s+(\\d+(?:\\.\\d+)?)%`),
  );
  if (!m) throw new Error(`missing HSL slot --${token}`);
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

describe('named theme: .dark[data-theme="intelligence"]', () => {
  const css = block('.dark[data-theme="intelligence"]');

  it("retints the surface canvas to violet", () => {
    for (const token of ["background", "card", "popover", "muted", "border"]) {
      const { h } = hsl(css, `hsl-${token}`);
      expect(h, `--hsl-${token} hue`).toBeGreaterThanOrEqual(255);
      expect(h, `--hsl-${token} hue`).toBeLessThanOrEqual(268);
    }
  });

  it("reads as graded depth, not mud: lightness rises, saturation tapers, hue locked", () => {
    const ladder = ["hsl-background", "hsl-card", "hsl-secondary"].map((t) =>
      hsl(css, t),
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
    expect(themes).toContain('.dark[data-theme="intelligence"]');
    expect(themes).not.toMatch(/(?<!\.dark)\[data-theme="intelligence"\]/);
    // No light variant: light falls through to brand's canonical light spine.
    expect(themes).not.toContain('[data-theme="intelligence-light"]');
  });
});
