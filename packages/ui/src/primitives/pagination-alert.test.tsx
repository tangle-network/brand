import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";
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

describe("Pagination link mode", () => {
  const hrefFor = (page: number) => `?page=${page + 1}`;

  it("renders links to one-based URLs from zero-based pages", () => {
    render(<Pagination page={4} pageCount={12} hrefFor={hrefFor} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "?page=4");
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "?page=6");
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("href", "?page=1");
    expect(screen.getByRole("link", { name: "Page 12" })).toHaveAttribute("href", "?page=12");

    const current = screen.getByRole("link", { name: "Page 5" });
    expect(current.tagName).toBe("A");
    expect(current).toHaveAttribute("href", "?page=5");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Page 4" })).not.toHaveAttribute("aria-current");
  });

  it("renders a disabled previous or next as a span without an href", () => {
    const { rerender } = render(<Pagination page={0} pageCount={3} hrefFor={hrefFor} />);
    const previous = screen.getByRole("link", { name: "Previous page" });
    expect(previous.tagName).toBe("SPAN");
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(previous).not.toHaveAttribute("href");
    expect(previous.className).toContain("aria-disabled:opacity-50");
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "?page=2");

    rerender(<Pagination page={2} pageCount={3} hrefFor={hrefFor} />);
    const next = screen.getByRole("link", { name: "Next page" });
    expect(next.tagName).toBe("SPAN");
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).not.toHaveAttribute("href");
  });

  it("renders each enabled control with a custom link component", () => {
    const received: string[] = [];
    const RouterLink = ({ href, ...props }: React.ComponentProps<"a">) => {
      received.push(href ?? "");
      return <a data-router-link="" href={href} {...props} />;
    };
    render(<Pagination page={1} pageCount={3} hrefFor={hrefFor} linkComponent={RouterLink} />);

    expect(received).toEqual(["?page=1", "?page=1", "?page=2", "?page=3", "?page=3"]);
    const current = screen.getByRole("link", { name: "Page 2" });
    expect(current).toHaveAttribute("data-router-link");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("requires onPageChange or hrefFor, and a link component only with hrefFor", () => {
    const rejected = [
      // @ts-expect-error neither onPageChange nor hrefFor
      () => <Pagination page={0} pageCount={2} />,
      // @ts-expect-error linkComponent without hrefFor
      () => <Pagination page={0} pageCount={2} onPageChange={vi.fn()} linkComponent="a" />,
    ];
    expect(rejected).toHaveLength(2);
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
