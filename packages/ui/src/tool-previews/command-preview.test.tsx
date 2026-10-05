import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ToolPart } from "../types/parts";
import { CommandPreview } from "./command-preview";

function part(state: Partial<ToolPart["state"]>): ToolPart {
  return {
    type: "tool",
    id: "t1",
    tool: "bash",
    state: { status: "completed", input: { command: "git status --short" }, ...state },
  } as ToolPart;
}

describe("CommandPreview", () => {
  it("shows a neutral badge, not a red exit, when a tool errored without an exit code", () => {
    render(<CommandPreview part={part({ status: "error", output: "warning: x" })} />);
    const badge = screen.getByText("tool error");
    expect(badge.className).toContain("surface-neutral");
    expect(badge.className).not.toContain("surface-danger");
    expect(screen.queryByText("error")).toBeNull();
  });

  it("keeps a recorded nonzero exit red", () => {
    render(
      <CommandPreview
        part={part({ status: "error", output: { stdout: "", stderr: "no", exitCode: 2 } })}
      />,
    );
    expect(screen.getByText("exit 2").className).toContain("surface-danger");
  });

  it("keeps each short token whole so a phone wraps between flags", () => {
    render(<CommandPreview part={part({ output: "M a" })} />);
    const flag = screen.getByText("--short");
    expect(flag.tagName).toBe("SPAN");
    expect(flag.className).toContain("whitespace-nowrap");
    // The text is unchanged, so a copy pastes the exact command.
    expect(screen.getByTestId("command-preview").querySelector("code")?.textContent).toBe(
      "git status --short",
    );
  });

  it("lets a token longer than a phone line break", () => {
    const sha = "e006b2aad5a5f72227f0eea058213149798853d2";
    render(<CommandPreview part={part({ input: { command: `git diff ${sha}` }, output: "x" })} />);
    expect(screen.queryByText(sha, { selector: "span" })).toBeNull();
  });

  it("is a quiet row until opened, then a dark terminal", () => {
    render(<CommandPreview part={part({ output: "M a" })} />);
    const block = screen.getByTestId("command-preview");
    expect(block).not.toHaveAttribute("data-theme");
    expect(block.className).toContain("bg-transparent");
    fireEvent.click(screen.getByRole("button"));
    expect(block).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("region", { name: "stdout" })).toHaveTextContent("M a");
  });
});
