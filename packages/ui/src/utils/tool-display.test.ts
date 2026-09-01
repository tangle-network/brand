import { describe, expect, it } from "vitest";
import type { ToolPart } from "../types/parts";
import { getToolDisplayMetadata } from "./tool-display";

function part(tool: string, input: unknown): ToolPart {
  return {
    type: "tool",
    id: `id-${tool}`,
    tool,
    state: { status: "completed", input },
  };
}

describe("getToolDisplayMetadata", () => {
  it.each([
    ["read", { file_path: "/home/u/project/src/app.ts" }, "Read", "/home/u/project/src/app.ts"],
    ["edit", { path: "src/app.ts" }, "Edit", "src/app.ts"],
    ["write", { file: "src/new.ts" }, "Write", "src/new.ts"],
    ["bash", { command: "pnpm test --run" }, "Shell", "pnpm test --run"],
    ["grep", { pattern: "useCallback" }, "Search", "useCallback"],
    ["glob", { pattern: "src/**/*.ts" }, "Find", "src/**/*.ts"],
    ["web_search", { query: "vitest mocking" }, "Web search", "vitest mocking"],
    ["web_fetch", { url: "https://vitest.dev" }, "Fetch", "https://vitest.dev"],
    ["task", { description: "audit routes" }, "Task", "audit routes"],
  ])("%s → bare verb title, subject in the description only", (tool, input, title, description) => {
    const meta = getToolDisplayMetadata(part(tool, input));
    expect(meta.title).toBe(title);
    expect(meta.description).toBe(description);
    expect(meta.title).not.toContain(description);
  });

  it("keeps the untruncated path and command for consumers that need them", () => {
    const edit = getToolDisplayMetadata(part("edit", { file_path: "/a/b/c/d/e.ts" }));
    expect(edit.targetPath).toBe("/a/b/c/d/e.ts");
    expect(edit.diffFilePath).toBe("/a/b/c/d/e.ts");

    const long = "x".repeat(80);
    const shell = getToolDisplayMetadata(part("bash", { command: long }));
    expect(shell.commandSnippet).toBe(long);
    expect(shell.description).toHaveLength(60);
  });

  it("falls back to the verb alone when the input carries no subject", () => {
    expect(getToolDisplayMetadata(part("read", {})).title).toBe("Read");
    expect(getToolDisplayMetadata(part("read", {})).description).toBeUndefined();
  });

  it("names unknown tools by their tool name", () => {
    const meta = getToolDisplayMetadata(part("custom_probe", { pattern: "p" }));
    expect(meta.title).toBe("custom_probe");
    expect(meta.description).toBe("p");
  });
});
