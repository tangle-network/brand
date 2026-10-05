import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blockIn } from "./css-test-utils";

const read = (name: string) =>
  readFileSync(path.resolve(import.meta.dirname, name), "utf8");
const tokens = read("tokens.css");

describe("scrim and media ink", () => {
  it("are declared once on the shared baseline, so every theme dims the same way", () => {
    const baseline = blockIn(tokens, ".dark");
    expect(baseline).toMatch(/--scrim:\s*rgb\(0 0 0 \/ 0\.4\);/);
    expect(baseline).toMatch(/--scrim-strong:\s*rgb\(0 0 0 \/ 0\.72\);/);
    expect(baseline).toMatch(/--on-media:\s*#ffffff;/);
    expect(blockIn(tokens, ".light")).not.toMatch(/^\s*--(scrim|on-media)[\w-]*\s*:/m);
    expect(read("named-themes.css")).not.toMatch(/^\s*--(scrim|on-media)[\w-]*\s*:/m);
  });
});
