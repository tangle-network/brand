import { describe, expect, it } from "vitest";
import { blockIn, hexRelativeLuminanceIn, hslIn } from "./css-test-utils";

/**
 * The helpers every other suite's correctness rests on.
 *
 * Their failure mode is the dangerous one: they return something that still looks
 * like CSS, so a wrong answer here makes assertions pass or fail against the wrong
 * text instead of erroring. Each case below is a way that can happen.
 */
describe("blockIn", () => {
  it("anchors on the rule, not on prose that names the selector", () => {
    const css = `
/* the .light spine is defined below */
.dark { --x: 1; }
.light { --x: 2; }`;
    expect(blockIn(css, ".light")).toContain("--x: 2");
  });

  it("closes on THIS block's brace, not the first nested one", () => {
    const css = `
.dark {
  --outer: 1;
  @media (min-width: 40rem) { --inner: 2; }
  --after-nested: 3;
}
.light { --x: 9; }`;
    const block = blockIn(css, ".dark");
    expect(block, "a nested rule must not end the block early").toContain(
      "--after-nested",
    );
    expect(block, "and must not swallow the following rule").not.toContain(
      "--x: 9",
    );
  });

  it("tolerates a missing space before the brace", () => {
    expect(blockIn(".dark{ --x: 1; }", ".dark")).toContain("--x: 1");
  });

  it("throws on a missing or unterminated block rather than returning junk", () => {
    expect(() => blockIn(".dark { --x: 1; }", ".nope")).toThrow(/missing/);
    expect(() => blockIn(".dark { --x: 1;", ".dark")).toThrow(/unterminated/);
  });
});

describe("hexRelativeLuminanceIn", () => {
  it("reads #rgb, #rrggbb and #rrggbbaa alike", () => {
    // #fff and #ffffff are the same color; the alpha byte does not change its
    // luminance.
    expect(hexRelativeLuminanceIn("--a: #fff;", "a")).toBeCloseTo(1, 10);
    expect(hexRelativeLuminanceIn("--a: #ffffff;", "a")).toBeCloseTo(1, 10);
    expect(hexRelativeLuminanceIn("--a: #ffffff80;", "a")).toBeCloseTo(1, 10);
    expect(hexRelativeLuminanceIn("--a: #000;", "a")).toBeCloseTo(0, 10);
  });

  it("orders planes by perceived brightness, not by HSL lightness", () => {
    const canvas = hexRelativeLuminanceIn("--a: #0a0a14;", "a");
    const card = hexRelativeLuminanceIn("--a: #191826;", "a");
    expect(card).toBeGreaterThan(canvas);
  });

  it("follows an alias to the colour it paints, and names an alias that leads nowhere", () => {
    expect(hexRelativeLuminanceIn("--a: var(--b); --b: #fff;", "a")).toBe(1);
    expect(hexRelativeLuminanceIn("--a: hsl(var(--b)); --b: 0 0% 100%;", "a")).toBe(1);
    expect(() => hexRelativeLuminanceIn("--a: var(--b);", "a")).toThrow(/--b is not defined/);
    expect(() => hexRelativeLuminanceIn("--a: rgba(0, 0, 0, 0.5);", "a")).toThrow(/not a hex color/);
    expect(() => hexRelativeLuminanceIn("--a: #fff;", "b")).toThrow(/not defined/);
  });
});

describe("hslIn", () => {
  it("reads an `H S% L%` triple", () => {
    expect(hslIn("--a: 240 33% 6%;", "a")).toEqual({ h: 240, s: 33, l: 6 });
  });

  it("follows an alias to its triple, and throws when the slot is absent or not a triple", () => {
    expect(hslIn("--a: var(--b); --b: 240 33% 6%;", "a")).toEqual({ h: 240, s: 33, l: 6 });
    expect(() => hslIn("--a: 240 33% 6%;", "b")).toThrow(/not defined/);
    expect(() => hslIn("--a: #fff;", "a")).toThrow(/not an HSL triple/);
  });
});
