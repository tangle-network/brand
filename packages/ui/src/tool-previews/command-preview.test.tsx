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
  it("shows an amber badge, not a red exit, when a tool errored without an exit code", () => {
    render(<CommandPreview part={part({ status: "error", output: "warning: x" })} />);
    const badge = screen.getByText("tool reported error");
    expect(badge.className).toContain("surface-warning");
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

  it("boxes each token of an opened command so a phone wraps between flags", () => {
    render(<CommandPreview part={part({ output: "M a" })} />);
    fireEvent.click(screen.getByRole("button"));
    const flag = screen.getByText("--short");
    expect(flag.tagName).toBe("SPAN");
    expect(flag.className).toContain("inline-block");
    // A box wider than the line still breaks, so no token overflows.
    expect(flag.className).toContain("[overflow-wrap:anywhere]");
    // The text is unchanged, so a copy pastes the exact command.
    expect(screen.getByTestId("command-preview").querySelector("code")?.textContent).toBe(
      "git status --short",
    );
  });

  it("treats a timeout or a signal as a failure even without an exit code", () => {
    render(
      <CommandPreview
        part={part({ status: "error", output: { stdout: "", stderr: "", timedOut: true } })}
      />,
    );
    expect(screen.getByText("timed out").className).toContain("surface-danger");
  });

  it("keeps a runner error after a clean exit amber, not red", () => {
    render(
      <CommandPreview
        part={part({ status: "error", output: { stdout: "ok", stderr: "", exitCode: 0 } })}
      />,
    );
    expect(screen.getByText("exit 0 · tool reported error").className).toContain("surface-warning");
  });

  it("shows a closed command as plain text that ends in an ellipsis, whole in its title", () => {
    render(<CommandPreview part={part({ output: "M a" })} />);
    const code = screen.getByTestId("command-preview").querySelector("code");
    expect(code?.className).toContain("line-clamp-2");
    expect(code).toHaveAttribute("title", "git status --short");
    expect(code?.querySelector("span")).toBeNull();
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

describe("CommandPreview output", () => {
  it("offers the rest of an output its height cap hides", () => {
    const scroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => 900 });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 320 });
    try {
      render(<CommandPreview part={part({ output: "a\nb\nc" })} defaultExpanded />);
      fireEvent.click(screen.getByRole("button", { name: "Show all stdout (3 lines)" }));
      expect(screen.getByRole("region", { name: "stdout" }).className).not.toContain("max-h-80");
      expect(screen.queryByRole("button", { name: /Show all stdout/ })).toBeNull();
    } finally {
      if (scroll) Object.defineProperty(HTMLElement.prototype, "scrollHeight", scroll);
      if (client) Object.defineProperty(HTMLElement.prototype, "clientHeight", client);
    }
  });
});
