import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title as the page's only h1", () => {
    render(<PageHeader title="Workflows" />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Workflows");
  });

  it("steps the title down to h2 for a nested surface", () => {
    render(<PageHeader level={2} title="Skills" />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Skills",
    );
  });

  it("puts the id on the heading so a region can point aria-labelledby at it", () => {
    render(<PageHeader titleId="keys-title" title="API keys" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
      "id",
      "keys-title",
    );
  });

  // The description is prose ABOUT the page, so it must not land in the
  // heading — a paragraph rendered where a heading goes reads as body copy to a
  // sighted reader and as the page's accessible name to a screen reader.
  it("keeps the description out of the heading", () => {
    render(<PageHeader title="Billing" description="Spend and invoices." />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Billing");
    expect(heading).not.toHaveTextContent("Spend and invoices.");
    expect(screen.getByText("Spend and invoices.")).toBeInTheDocument();
  });

  it("renders the actions and meta slots when given", () => {
    render(
      <PageHeader
        title="Teams"
        actions={<button type="button">Invite</button>}
        meta={<span>4 members</span>}
      />,
    );
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
    expect(screen.getByText("4 members")).toBeInTheDocument();
  });

  it("omits the optional slots entirely when not given", () => {
    const { container } = render(<PageHeader title="Alerts" />);
    expect(container.querySelector("p")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("maps Sandbox inputs while keeping title, eyebrow and description separate", () => {
    const { container } = render(<PageHeader title="Activity" titleAs="h3" eyebrow="Workspace" description="Recent events" action={<button type="button">Export</button>} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Activity");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(screen.getByText("Workspace").tagName).toBe("P");
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    for (const attribute of ["action", "actions", "titleAs", "eyebrow", "level"]) {
      expect(container.querySelector("header")).not.toHaveAttribute(attribute);
    }
  });

  it("gives actions precedence without duplicating controls, including explicit null", () => {
    const fallback = <button type="button">Legacy</button>;
    const { rerender } = render(<PageHeader title="Activity" action={fallback} actions={<button type="button">Canonical</button>} />);
    expect(screen.getByRole("button", { name: "Canonical" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Legacy" })).toBeNull();
    rerender(<PageHeader title="Activity" action={fallback} actions={null} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("lets titleAs override level's element but not its visual treatment", () => {
    const { rerender } = render(<PageHeader title="Nested" level={2} />);
    const classes = screen.getByRole("heading", { level: 2 }).className;
    rerender(<PageHeader title="Nested" level={2} titleAs="h4" />);
    expect(screen.getByRole("heading", { level: 4 }).className).toBe(classes);
  });

  it("preserves the header ref, native attributes and zero-valued metadata", () => {
    const ref = createRef<HTMLElement>();
    render(<PageHeader ref={ref} title="Activity" titleId="activity-title" id="masthead" aria-labelledby="activity-title" className="custom" meta={0} />);
    expect(ref.current?.tagName).toBe("HEADER");
    expect(ref.current).toHaveAttribute("id", "masthead");
    expect(ref.current).toHaveAttribute("aria-labelledby", "activity-title");
    expect(ref.current).toHaveClass("custom");
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("does not truncate long titles or put action labels inside the heading", () => {
    const title = "A".repeat(180);
    render(<PageHeader title={title} actions={<button type="button">Export the selected activity</button>} />);
    const heading = screen.getByRole("heading", { name: title });
    expect(heading).toHaveClass("[overflow-wrap:anywhere]");
    expect(heading).not.toHaveClass("truncate");
    expect(heading).not.toHaveTextContent("Export the selected activity");
    expect(screen.getByRole("button").parentElement).toHaveClass("flex-wrap", "min-w-0", "max-w-full");
  });
});
