import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn } from "./css-test-utils";

/**
 * A token declared in both files has to carry the same value in both.
 *
 * `tokens.css` is what a consumer reads at runtime through `var(--x)`.
 * `theme.css` is the Tailwind v4 `@theme` block, and it exists because Tailwind
 * only emits a utility for a token it can see declared there — so the shared
 * ones are necessarily written twice.
 *
 * That duplication is structural and cannot be factored out: `@theme` needs a
 * literal, and a self-reference would be circular. What it can be is GATED. An
 * edit to one file that misses the other would leave `shadow-overlay` (the
 * utility, from theme.css) rendering a different shadow from
 * `shadow-[var(--shadow-overlay)]` (the variable, from tokens.css), and the
 * mismatch would show up as an inconsistency no one could reproduce from
 * either file alone.
 */
const read = (name: string) =>
  readFileSync(path.resolve(import.meta.dirname, name), "utf8");

/** `--token: value;` pairs in one CSS block, whitespace collapsed. */
function declarationsIn(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out.set(m[1] as string, (m[2] as string).split(/\s+/).join(" ").trim());
  }
  return out;
}

// The default spine, which is the one `@theme` mirrors. Anchor on the last
// selector of the multi-selector header, as the other suites here do.
const tokensCss = read("tokens.css");
const runtime = declarationsIn(blockIn(tokensCss, ".dark"));
const light = declarationsIn(blockIn(tokensCss, ".light"));
const theme = declarationsIn(blockIn(read("theme.css"), "@theme"));

const shared = [...theme.keys()].filter((t) => runtime.has(t)).sort();

describe("tokens.css and theme.css agree on every token they both declare", () => {
  it("finds the shared tokens to check", () => {
    // Guards the parse itself: a selector rename that silently emptied one
    // block would otherwise make every assertion below vacuously pass.
    expect(shared.length).toBeGreaterThan(5);
  });

  for (const token of shared) {
    it(`${token} carries one value`, () => {
      expect(theme.get(token)).toBe(runtime.get(token));
    });
  }
});

/**
 * A token written in terms of `--hsl-foreground` already inverts, because that
 * ramp is what each spine redefines. Restating it on the light spine would pin
 * it to one theme's ink and defeat the derivation — the failure would be silent,
 * since both declarations are individually valid CSS.
 *
 * So the omission is the contract, and this asserts it rather than trusting the
 * comment that states it.
 */
const selfInverting = [...runtime.entries()]
  .filter(([, value]) => value.includes("var(--hsl-foreground)"))
  .map(([token]) => token)
  .sort();

describe("a self-inverting token is declared once, not per spine", () => {
  it("finds the self-inverting tokens to check", () => {
    expect(selfInverting.length).toBeGreaterThan(0);
  });

  for (const token of selfInverting) {
    it(`${token} is not restated on the light spine`, () => {
      expect(light.has(token)).toBe(false);
    });
  }
});
