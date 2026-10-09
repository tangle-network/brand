import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RunPhaseList } from "./run-phase-list";

afterEach(cleanup);

describe("RunPhaseList", () => {
  it("collapses each phase to one summarizing line and expands its steps", () => {
    render(
      <RunPhaseList
        phases={[
          { id: "a", title: "Find the hero source", summary: "Read 12 files · searched 3 times", content: <p>step detail</p> },
          { id: "b", title: "Open a draft PR", summary: "4 GitHub calls", status: "error", content: <p>pr detail</p> },
        ]}
      />,
    );
    const first = screen.getByRole("button", { name: /Find the hero source/ });
    expect(first.textContent).toContain("Read 12 files · searched 3 times");
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("step detail")).toBeNull();
    fireEvent.click(first);
    expect(screen.getByText("step detail")).toBeInTheDocument();
    expect(screen.getByLabelText("Had an error")).toBeInTheDocument();
  });
});
