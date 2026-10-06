import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Pagination, pageSlots } from "./pagination";

const PALETTE = /\b(?:bg|text|border)-(?:slate|zinc|gray|neutral|blue|green|red|amber|emerald|black|white)(?:-\d|\b)/;

describe("pageSlots", () => {
  it("lists every page when they fit", () => {
    expect(pageSlots(0, 1)).toEqual([0]);
    expect(pageSlots(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("keeps the same number of slots as the current page moves", () => {
    expect(pageSlots(0, 10)).toEqual([0, 1, 2, 3, 4, "gap-end", 9]);
    expect(pageSlots(5, 10)).toEqual([0, "gap-start", 4, 5, 6, "gap-end", 9]);
    expect(pageSlots(9, 10)).toEqual([0, "gap-start", 5, 6, 7, 8, 9]);
    for (let page = 0; page < 40; page++) expect(pageSlots(page, 40)).toHaveLength(7);
  });

  it("clamps a page outside the range", () => {
    expect(pageSlots(-3, 10)).toEqual(pageSlots(0, 10));
    expect(pageSlots(99, 10)).toEqual(pageSlots(9, 10));
  });
});

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pagination page={0} pageCount={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks the current page and moves with previous, next and a number", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={4} pageCount={12} onPageChange={onPageChange} />);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    const current = screen.getByRole("button", { name: "Page 5" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.className).not.toMatch(PALETTE);

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Page 12" }));
    expect(onPageChange.mock.calls).toEqual([[3], [5], [11]]);
  });

  it("disables previous on the first page and next on the last", () => {
    const { rerender } = render(<Pagination page={0} pageCount={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    rerender(<Pagination page={2} pageCount={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("does not report the page that is already current", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

describe("Alert", () => {
  it("paints a tone from the matched Brand status triple", () => {
    render(
      <Alert tone="warning">
        <AlertTitle>Policy is changing</AlertTitle>
        <AlertDescription>Seats above the limit are removed next cycle.</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("bg-[var(--surface-warning-bg)]");
    expect(alert.className).toContain("text-[var(--surface-warning-text)]");
    expect(alert.className).not.toMatch(PALETTE);
  });

  it("uses role status for quiet tones and keeps an explicit role", () => {
    const { rerender } = render(<Alert tone="info">Saved</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    rerender(
      <Alert tone="neutral" role="note">
        Note
      </Alert>,
    );
    expect(screen.getByRole("note")).toHaveAttribute("data-tone", "neutral");
  });
});
