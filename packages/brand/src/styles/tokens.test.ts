import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn } from "./themes.test";

/**
 * The canonical spine's structural contract.
 *
 * The whole point of this palette is that a surface separates from the one below
 * it by its own FILL. A flat, desaturated ladder pushes that job onto borders,
 * and the app reads grey and washed out — which is the state this replaced. The
 * numbers are therefore not decoration; they are the contract, and these
 * assertions pin the properties rather than the exact values, so a retune is
 * free but a collapse back to flat is not.
 */
const tokens = readFileSync(
  path.resolve(import.meta.dirname, "tokens.css"),
  "utf8",
);

// Each spine is declared on a multi-selector header
// (`:root, [data-sandbox-ui], [data-theme="dark"], .dark {`), so anchor on the
// LAST selector — the one the opening brace actually follows.
const DARK = blockIn(tokens, ".dark");
const LIGHT = blockIn(tokens, ".light");

function hsl(css: string, token: string): { h: number; s: number; l: number } {
  const m = css.match(
    new RegExp(
      `--${token}:\\s*(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)%\\s+(\\d+(?:\\.\\d+)?)%`,
    ),
  );
  if (!m) throw new Error(`missing HSL slot --${token}`);
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

function hexLightness(css: string, token: string): number {
  const m = css.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`missing surface --${token}`);
  const hex = m[1];
  const [r, g, b] = [1, 3, 5].map(
    (i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

describe("canonical dark spine", () => {
  it("is indigo-cast, not grey — the canvas carries real saturation", () => {
    const bg = hsl(DARK, "hsl-background");
    expect(bg.h, "canvas hue sits in the indigo band").toBeGreaterThanOrEqual(
      235,
    );
    expect(bg.h).toBeLessThanOrEqual(250);
    // The flat spine this replaced sat at 7%. Anything near that reads grey.
    expect(bg.s, "a desaturated canvas is the bug, not the design").toBeGreaterThan(
      20,
    );
  });

  it("lifts the card off the canvas by fill, not by border", () => {
    const canvas = hsl(DARK, "hsl-background");
    const card = hsl(DARK, "hsl-card");
    expect(card.l, "the card must be lighter than the canvas").toBeGreaterThan(
      canvas.l,
    );
    expect(
      card.l - canvas.l,
      "a <3% step is the flat ladder that forces separation onto borders",
    ).toBeGreaterThanOrEqual(3);
  });

  it("steps canvas -> card -> nested -> overlay monotonically upward", () => {
    const ladder = [
      "md3-surface",
      "md3-surface-container",
      "md3-surface-container-high",
      "md3-surface-container-highest",
    ].map((t) => hexLightness(DARK, t));
    for (let i = 1; i < ladder.length; i++) {
      expect(
        ladder[i],
        `elevation step ${i} must be lighter than the plane below it`,
      ).toBeGreaterThan(ladder[i - 1]);
    }
  });
});

describe("canonical light spine", () => {
  it("is white paper on a TINTED canvas, never white-on-white", () => {
    const canvas = hsl(LIGHT, "hsl-background");
    const card = hsl(LIGHT, "hsl-card");
    expect(card.l, "the card is paper").toBe(100);
    expect(
      canvas.l,
      "a pure-white canvas gives a white card nothing to lift off",
    ).toBeLessThan(97);
    expect(canvas.s, "the canvas carries a tint, not flat grey").toBeGreaterThan(
      10,
    );
  });

  it("keeps the derived --bg-* surfaces on the ladder", () => {
    // Hardcoded hex here is how `bg-card` (→ --hsl-card) and `var(--bg-card)`
    // drifted into disagreeing about what a card is.
    for (const token of ["bg-dark", "bg-card", "bg-elevated", "bg-section"]) {
      expect(LIGHT, `--${token} must derive from the ladder`).toMatch(
        new RegExp(`--${token}:\\s*var\\(--depth-`),
      );
    }
  });
});
