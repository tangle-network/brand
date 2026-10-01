import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("keeps the generated light-default contract and all canonical mutations checked", () => {
  const output = execFileSync(process.execPath, [
    "--test",
    fileURLToPath(new URL("../../scripts/gen-compat.test.mjs", import.meta.url)),
  ], { encoding: "utf8" });
  expect(output).toContain("# fail 0");
});
