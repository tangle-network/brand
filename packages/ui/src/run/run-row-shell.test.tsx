import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatDuration } from "../utils/format";
import { RunRowShell } from "./run-row-shell";

function renderShell(
  status: "running" | "success" | "error" | "idle",
  extra: { durationMs?: number; collapsedError?: string } = {},
) {
  return render(
    <RunRowShell
      icon={<span data-testid="lead-icon">icon</span>}
      title="Ran command"
      status={status}
      {...extra}
    >
      <div>body</div>
    </RunRowShell>,
  );
}

describe("RunRowShell", () => {
  it("keeps the semantic lead icon visible in every status (no hijack)", () => {
    for (const status of ["running", "success", "error", "idle"] as const) {
      const { unmount } = renderShell(status);
      expect(screen.getByTestId("lead-icon")).toBeInTheDocument();
      expect(screen.getByText("Ran command")).toBeInTheDocument();
      unmount();
    }
  });

  it("draws no spinner while running — the running signal is the title", () => {
    const { container } = renderShell("running");
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector("[data-run-row-status]")).toBeNull();
  });

  it("renders no status dot on success (success is silence)", () => {
    const { container } = renderShell("success", { durationMs: 1200 });
    expect(container.querySelector("[data-run-row-status]")).toBeNull();
  });

  it("renders the red dot and the collapsed error on error", () => {
    const { container } = renderShell("error", {
      collapsedError: "exit code 1",
    });
    expect(
      container.querySelector('[data-run-row-status="error"]'),
    ).not.toBeNull();
    expect(screen.getByText("exit code 1")).toBeInTheDocument();
  });

  it("rests with no card chrome: transparent border and fill, bare glyph", () => {
    const { container } = renderShell("success");
    const row = container.querySelector("[data-run-row]");
    expect(row).not.toBeNull();
    expect(row!.className).toContain("border-transparent");
    expect(row!.className).toContain("bg-transparent");
    // The border stays reserved so hover/open never shift layout.
    expect(row!.className).toMatch(/(^|\s)border(\s|$)/);
    // No bordered badge box around the glyph.
    const glyph = container.querySelector("[data-run-row-glyph]");
    expect(glyph!.className).not.toContain("border");
  });

  it("takes the card fill only while open", () => {
    const { container } = render(
      <RunRowShell icon={<span>i</span>} title="Ran command" open>
        <div>body</div>
      </RunRowShell>,
    );
    const row = container.querySelector("[data-run-row]");
    expect(row!.className).toContain("bg-[var(--md3-surface-container)]");
    expect(row!.className).toContain("border-border");
  });

  it("reveals the completed duration on hover only", () => {
    const { container } = renderShell("success", { durationMs: 1840 });
    const duration = container.querySelector("[data-run-row-duration]");
    expect(duration).not.toBeNull();
    expect(duration!.textContent).toBe(formatDuration(1840));
    expect(duration!.className).toContain("opacity-0");
    expect(duration!.className).toContain("group-hover:opacity-100");
  });

  it("shows no duration while running", () => {
    const { container } = renderShell("running", { durationMs: 1840 });
    expect(container.querySelector("[data-run-row-duration]")).toBeNull();
  });

  it("puts the chevron in the glyph slot for expandable rows, hover/open only", () => {
    const { container } = renderShell("success");
    const chevron = container.querySelector("[data-run-row-chevron]");
    expect(chevron).not.toBeNull();
    expect(chevron!.getAttribute("class")).toContain("hidden");
    expect(chevron!.getAttribute("class")).toContain("group-hover:block");
  });

  it("is not expandable and has no chevron when no children are provided", () => {
    const { container } = render(
      <RunRowShell icon={<span>i</span>} title="Reasoning" />,
    );
    // The trigger button is disabled when there is no expandable body.
    const button = screen.getByRole("button", { name: /reasoning/i });
    expect(button).toBeDisabled();
    expect(container.querySelector("[data-run-row-chevron]")).toBeNull();
  });
});
