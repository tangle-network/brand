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
});
