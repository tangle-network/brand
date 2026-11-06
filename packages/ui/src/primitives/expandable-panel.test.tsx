import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExpandablePanel } from "./expandable-panel";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

describe("ExpandablePanel", () => {
  // The journey a run view needs: expand in place, let an inner popover take the
  // first Escape, close the top-most panel on the next, and hand focus back.
  it("expands in place and closes the top-most panel on Escape after inner layers", async () => {
    const user = userEvent.setup();
    render(
      <ExpandablePanel label="Run">
        <p data-testid="content">chart</p>
        <ExpandablePanel label="Chart">
          <Popover>
            <PopoverTrigger>Range</PopoverTrigger>
            <PopoverContent>Last 24 hours</PopoverContent>
          </Popover>
        </ExpandablePanel>
      </ExpandablePanel>,
    );
    const content = screen.getByTestId("content"), outer = content.parentElement!;

    await user.click(screen.getByRole("button", { name: "Expand Run" }));
    expect(outer).toHaveAttribute("data-expanded");
    expect(outer.className).toContain("fixed");
    expect(screen.getByTestId("content")).toBe(content);
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Expand Chart" }));
    await user.click(screen.getByRole("button", { name: "Range" }));
    expect(await screen.findByText("Last 24 hours")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Last 24 hours")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Close full screen Chart" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Expand Chart" })).toHaveFocus();
    expect(outer).toHaveAttribute("data-expanded");
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(outer).not.toHaveAttribute("data-expanded");
    expect(screen.getByRole("button", { name: "Expand Run" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });
});
