import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ApprovalCard } from "./approval-card";

afterEach(cleanup);

describe("ApprovalCard", () => {
  it("shows the plain-language action, its step, the plan, the diff and the raw input behind Details", () => {
    render(
      <ApprovalCard
        title="Create a commit for src/routes/_index.tsx in tangle-network/gtm-agent"
        context="GitHub · tangle-network/gtm-agent"
        step={{ index: 1, total: 4 }}
        plan={[
          { label: "Write the change", state: "current" },
          { label: "Commit it", state: "upcoming" },
        ]}
        diff={[{ path: "src/routes/_index.tsx", change: "modified", additions: 3, deletions: 1 }]}
        details={<pre>{'{"tree":[]}'}</pre>}
        actions={<button type="button">Approve all 4 steps</button>}
      />,
    );
    const card = screen.getByRole("group", { name: "Approval request" });
    expect(within(card).getByRole("heading").textContent).toContain("Create a commit for src/routes/_index.tsx");
    expect(within(card).getByText("Step 1 of 4")).toBeInTheDocument();
    expect(within(card).getByRole("list", { name: "Plan" }).querySelector('[aria-current="step"]')?.textContent).toBe("Write the change");
    expect(within(card).getByText("1 file")).toBeInTheDocument();
    expect(within(card).getAllByText("+3")).toHaveLength(2);
    const details = within(card).getByText("Details").closest("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(within(card).getByText("Details"));
    expect(details.open).toBe(true);
    expect(within(card).getByRole("button", { name: "Approve all 4 steps" })).toBeInTheDocument();
  });

  it("marks unknown line counts instead of guessing zero", () => {
    render(<ApprovalCard title="Write" diff={[{ path: "a.ts", additions: 2 }]} diffNote="Counting lines…" />);
    expect(screen.getByText("Counting lines…")).toBeInTheDocument();
    expect(screen.getByText("−–")).toBeInTheDocument();
  });
});
