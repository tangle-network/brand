import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

describe("Checkbox", () => {
  it("toggles from its label and exposes checkbox state", () => {
    render(
      <>
        <Checkbox id="notify" />
        <Label htmlFor="notify">Email me</Label>
      </>,
    );
    const box = screen.getByRole("checkbox", { name: "Email me" });
    expect(box).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByText("Email me"));
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("reports the indeterminate state as mixed", () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" />);
    expect(screen.getByRole("checkbox", { name: "Select all" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });

  it("paints with tokens, never palette utilities", () => {
    render(<Checkbox aria-label="Agree" defaultChecked />);
    const cls = screen.getByRole("checkbox").className;
    expect(cls).toContain("data-[state=checked]:bg-primary");
    expect(cls).not.toMatch(/\b(?:bg|text|border)-(?:slate|zinc|gray|neutral|blue|green|red|amber|emerald)-\d/);
  });
});

describe("Separator", () => {
  it("is hidden from assistive technology unless it is semantic", () => {
    const { container, rerender } = render(<Separator />);
    expect(container.firstElementChild).toHaveAttribute("role", "none");
    rerender(<Separator decorative={false} orientation="vertical" />);
    const rule = screen.getByRole("separator");
    expect(rule).toHaveAttribute("aria-orientation", "vertical");
    expect(rule.className).toContain("w-px");
  });
});

describe("Sheet", () => {
  it("opens as a labelled dialog and closes from its close button", async () => {
    render(
      <Sheet>
        <SheetTrigger>Open chat</SheetTrigger>
        <SheetContent side="left">
          <SheetTitle>Assistant</SheetTitle>
          <SheetDescription>Ask about this run.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    fireEvent.click(screen.getByText("Open chat"));
    const dialog = await screen.findByRole("dialog", { name: "Assistant" });
    expect(dialog.className).toContain("slide-in-from-left");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("can hide its close button", async () => {
    render(
      <Sheet defaultOpen>
        <SheetContent hideCloseButton>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the list.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await screen.findByRole("dialog", { name: "Filters" });
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});

describe("Tooltip", () => {
  it("shows its label when the trigger receives keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger aria-label="Runs">R</TooltipTrigger>
          <TooltipContent>Runs</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Runs");
  });
});
