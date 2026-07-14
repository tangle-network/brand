import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn, hexLightnessIn, hslIn } from "./css-test-utils";

/**
 * The canonical spine's structural contract.
 *
 * The whole point of this palette is that a surface separates from the one below
 * it by its own FILL. A flat, desaturated ladder pushes that job onto borders,
 * and the app reads grey and washed out — which is the state this replaced. The
 * numbers are therefore not decoration; they are the contract. These assertions
 * pin the PROPERTIES rather than the exact values, so a retune stays free but a
 * collapse back to flat does not.
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

describe("canonical dark spine", () => {
  it("is indigo-cast, not grey — the canvas carries real saturation", () => {
    const bg = hslIn(DARK, "hsl-background");
    expect(bg.h, "canvas hue sits in the indigo band").toBeGreaterThanOrEqual(
      235,
    );
    expect(bg.h).toBeLessThanOrEqual(250);
    // The flat spine this replaced sat at 7%. Anything near that reads grey.
    expect(
      bg.s,
      "a desaturated canvas is the bug, not the design",
    ).toBeGreaterThan(20);
  });

  it("lifts the card off the canvas by fill, not by border", () => {
    const canvas = hslIn(DARK, "hsl-background");
    const card = hslIn(DARK, "hsl-card");
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
    ].map((t) => hexLightnessIn(DARK, t));
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
    const canvas = hslIn(LIGHT, "hsl-background");
    const card = hslIn(LIGHT, "hsl-card");
    expect(card.l, "the card is paper").toBe(100);
    expect(
      canvas.l,
      "a pure-white canvas gives a white card nothing to lift off",
    ).toBeLessThan(97);
    expect(
      canvas.s,
      "the canvas carries a tint, not flat grey",
    ).toBeGreaterThan(10);
  });

  it("ALTERNATES paper and well — light elevation is not a darkening ramp", () => {
    // Deliberately not monotonic. On a tinted canvas a raised plane is paper and
    // a recessed one is a tinted well, so the ladder alternates. Pinning it stops
    // a well-meaning "fix" from forcing a strictly-ordered ramp, which is exactly
    // what produced the white-on-white flatness this palette replaced.
    const paper = ["md3-surface-container", "md3-surface-container-highest"];
    const wells = ["md3-surface-container-low", "md3-surface-container-high"];
    const canvas = hexLightnessIn(LIGHT, "md3-surface");

    for (const t of paper) {
      expect(hexLightnessIn(LIGHT, t), `${t} is paper`).toBe(1);
    }
    for (const t of wells) {
      const l = hexLightnessIn(LIGHT, t);
      expect(l, `${t} is a well — below paper`).toBeLessThan(1);
      expect(l, `${t} still sits above the canvas`).toBeGreaterThan(canvas);
    }
  });

  it("lets the overlay share the card's fill — it lifts by shadow, not lightness", () => {
    // `--bg-card` (depth-2) and `--bg-elevated` (depth-4) are both paper by design;
    // the semantic layer agrees (--hsl-card and --hsl-popover are both white). The
    // separation is the shadow, so a shadow token must exist to carry it.
    expect(hexLightnessIn(LIGHT, "depth-2")).toBe(1);
    expect(hexLightnessIn(LIGHT, "depth-4")).toBe(1);
    expect(LIGHT, "the overlay's separation depends on this").toMatch(
      /--shadow-dropdown:/,
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
