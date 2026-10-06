import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { palettes } from "./palette.generated";

describe("resolved palettes", () => {
  it("are fresh against tokens.css and named-themes.css", () => {
    const script = path.resolve(import.meta.dirname, "..", "scripts", "gen-palette.mjs");
    expect(() => execFileSync(process.execPath, [script, "--check"], { stdio: "pipe" })).not.toThrow();
  });

  it("hold only concrete colors", () => {
    for (const [theme, roles] of Object.entries(palettes)) {
      for (const [role, value] of Object.entries(roles)) {
        expect(value, `${theme}.${role}`).toMatch(/^(#[0-9a-f]{6}|rgba?\([^)]+\))$/);
      }
    }
  });

  it("keep the canonical planes", () => {
    expect(palettes.light.card).toBe("#ffffff");
    expect(palettes.light.canvas).not.toBe(palettes.light.card);
    expect(palettes.dark.canvas).not.toBe(palettes.dark.card);
  });
});
