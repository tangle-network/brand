import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading, type HeadingVariant } from "./heading";

const roles: [HeadingVariant, string][] = [
  ["display", "H1"], ["hero", "H2"], ["page", "H1"],
  ["section", "H2"], ["subsection", "H3"], ["eyebrow", "P"],
];

describe("Heading", () => {
  it.each(roles)("gives %s its existing default element", (variant, tag) => {
    render(<Heading variant={variant}>Title</Heading>);
    expect(screen.getByText("Title").tagName).toBe(tag);
  });

  it.each(roles)("maps Sandbox's %s role without emitting an invalid ARIA role", (role, tag) => {
    render(<Heading role={role}>Title</Heading>);
    const title = screen.getByText("Title");
    expect(title.tagName).toBe(tag);
    expect(title).not.toHaveAttribute("role");
  });

  it("changes semantics without changing the visual variant", () => {
    const { rerender } = render(<Heading variant="page">Title</Heading>);
    const classes = screen.getByRole("heading", { level: 1 }).className;
    rerender(<Heading variant="page" as="h4">Title</Heading>);
    expect(screen.getByRole("heading", { level: 4 }).className).toBe(classes);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("lets an explicit variant win over the existing visual-role input", () => {
    render(<Heading variant="section" role="page">Title</Heading>);
    expect(screen.getByRole("heading", { level: 2 })).not.toHaveAttribute("role");
  });

  it("forwards native roles, refs and HTML attributes", () => {
    const ref = createRef<HTMLElement>();
    render(<Heading ref={ref} variant="eyebrow" as="div" role="note" id="scope" className="custom" data-scope="all">Scope</Heading>);
    const note = screen.getByRole("note");
    expect(ref.current).toBe(note);
    expect(note).toHaveAttribute("id", "scope");
    expect(note).toHaveAttribute("data-scope", "all");
    expect(note).toHaveClass("custom");
  });

  it("keeps a page, section and nested title in document order", () => {
    render(<main>
      <Heading variant="page">Activity</Heading>
      <Heading variant="eyebrow">Last day</Heading>
      <Heading variant="section">Recent activity</Heading>
      <Heading variant="subsection">Details</Heading>
    </main>);
    expect(screen.getAllByRole("heading").map((node) => node.tagName)).toEqual(["H1", "H2", "H3"]);
  });
});
