import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, type CardTitleProps } from "./card";

describe("Card anatomy", () => {
  it("keeps the existing default title tag and heading ref", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<CardTitle ref={ref} id="card-title">Details</CardTitle>);
    expect(ref.current).toBe(screen.getByRole("heading", { level: 3 }));
    expect(ref.current).toHaveAttribute("id", "card-title");
  });

  it.each([1, 2, 3, 4, 5, 6] as const)("allows an h%i without changing its visual treatment", (level) => {
    const { rerender } = render(<CardTitle>Details</CardTitle>);
    const classes = screen.getByRole("heading").className;
    rerender(<CardTitle as={`h${level}` as CardTitleProps["as"]}>Details</CardTitle>);
    expect(screen.getByRole("heading", { level }).className).toBe(classes);
  });

  it("preserves native attributes and caller classes", () => {
    render(<CardTitle as="h2" role="presentation" className="text-xl" data-kind="summary">Summary</CardTitle>);
    const title = screen.getByText("Summary");
    expect(title).toHaveAttribute("role", "presentation");
    expect(title).toHaveAttribute("data-kind", "summary");
    expect(title).toHaveClass("text-xl");
  });

  it("uses the same gutter on every part and only removes subsequent top padding", () => {
    render(<Card>
      <CardHeader data-testid="header"><CardTitle>Details</CardTitle><CardDescription>Prose</CardDescription></CardHeader>
      <CardContent data-testid="content">Body</CardContent>
      <CardFooter data-testid="footer">Footer</CardFooter>
    </Card>);
    for (const part of ["header", "content", "footer"]) {
      expect(screen.getByTestId(part)).toHaveClass("p-4");
      expect(screen.getByTestId(part)).not.toHaveClass("p-6");
    }
    expect(screen.getByTestId("content")).toHaveClass("[&:not(:first-child)]:pt-0");
    expect(screen.getByTestId("footer")).toHaveClass("[&:not(:first-child)]:pt-0");
    // These are class/DOM contracts, not a browser-computed padding assertion.
    expect(screen.getByText("Prose").tagName).toBe("P");
  });

  it("does not strip the top padding unconditionally from content-only cards", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card><CardContent ref={ref}>Standalone</CardContent></Card>);
    expect(ref.current).toHaveClass("p-4");
    expect(ref.current).not.toHaveClass("pt-0");
    expect(ref.current?.matches(":first-child")).toBe(true);
  });

  it("keeps hover decorative and leaves keyboard activation to a real button", async () => {
    const user = userEvent.setup();
    const activate = vi.fn();
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} hover>
      <CardContent><button type="button" onClick={activate}>Open details</button></CardContent>
    </Card>);
    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current).not.toHaveAttribute("tabindex");
    expect(ref.current).not.toHaveAttribute("role");
    expect(ref.current).not.toHaveClass("cursor-pointer");
    await user.tab();
    expect(screen.getByRole("button", { name: "Open details" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(activate).toHaveBeenCalledTimes(2);
  });
});
