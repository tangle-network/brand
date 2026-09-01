import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ToolPart } from "../types/parts";
import { formatDuration } from "../utils/format";
import { InlineToolItem } from "./inline-tool-item";

const NOW = 1_700_000_000_000;

function part(overrides: Partial<ToolPart["state"]>, tool = "read"): ToolPart {
  return {
    type: "tool",
    id: `tool-${tool}`,
    tool,
    state: {
      status: "completed",
      input: { file_path: "src/lib/jitter.ts" },
      output: "export function jitter() {}",
      time: { start: NOW - 1200, end: NOW - 1140 },
      ...overrides,
    },
  };
}

describe("InlineToolItem", () => {
  it("titles the row with the bare verb and prints the path once", () => {
    const { container } = render(<InlineToolItem part={part({})} />);
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getAllByText("src/lib/jitter.ts")).toHaveLength(1);
    // The path never repeats inside the title.
    expect(container.textContent).not.toContain("Read src/lib/jitter.ts");
  });

  it("renders no status dot and no spinner once the call completes", () => {
    const { container } = render(<InlineToolItem part={part({})} />);
    expect(container.querySelector("[data-run-row-status]")).toBeNull();
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector(".tangle-text-shimmer")).toBeNull();
  });

  it("shimmers the verb while running instead of spinning", () => {
    const { container } = render(
      <InlineToolItem
        part={part({ status: "running", output: undefined, time: { start: NOW - 400 } }, "bash")}
      />,
    );
    const shimmer = container.querySelector(".tangle-text-shimmer");
    expect(shimmer).not.toBeNull();
    expect(shimmer!.textContent).toBe("Shell");
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector("[data-run-row-duration]")).toBeNull();
  });

  it("treats a pending call as running", () => {
    const { container } = render(
      <InlineToolItem part={part({ status: "pending", input: undefined, output: undefined })} />,
    );
    expect(container.querySelector(".tangle-text-shimmer")).not.toBeNull();
  });

  it("keeps the red dot and the collapsed error on failure", () => {
    const { container } = render(
      <InlineToolItem
        part={part({ status: "error", error: "ENOENT: no such file", output: undefined })}
      />,
    );
    expect(container.querySelector('[data-run-row-status="error"]')).not.toBeNull();
    expect(screen.getByText("ENOENT: no such file")).toBeInTheDocument();
  });

  it("carries the completed duration as a hover-only label", () => {
    const { container } = render(<InlineToolItem part={part({})} />);
    const duration = container.querySelector("[data-run-row-duration]");
    expect(duration!.textContent).toBe(formatDuration(60));
    expect(duration!.className).toContain("group-hover:opacity-100");
  });
});
