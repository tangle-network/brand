import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RunRowShell } from "./run-row-shell";

function renderShell(status: "running" | "success" | "error" | "idle") {
  return render(
    <RunRowShell
      icon={<span data-testid="lead-icon">icon</span>}
      title="Ran command"
      status={status}
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

  it("shows a spinner while running", () => {
    const { container } = renderShell("running");
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("is not expandable and has no chevron when no children are provided", () => {
    render(<RunRowShell icon={<span>i</span>} title="Reasoning" />);
    // The trigger button is disabled when there is no expandable body.
    const button = screen.getByRole("button", { name: /reasoning/i });
    expect(button).toBeDisabled();
  });
});
