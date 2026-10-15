import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComplianceBadge } from "./compliance-badge";

describe("ComplianceBadge", () => {
  // The copy rule the component exists to enforce: there is no official HIPAA
  // certification and the launch gate has not closed, so the unqualified claim
  // must never render unless a caller asks for it explicitly.
  it("defaults to HIPAA-Ready", () => {
    render(<ComplianceBadge />);
    expect(screen.getByLabelText("HIPAA-Ready")).toBeInTheDocument();
    expect(screen.queryByText("HIPAA Compliant")).not.toBeInTheDocument();
  });

  it("renders HIPAA Compliant only with an explicit compliant status", () => {
    render(<ComplianceBadge status="compliant" />);
    expect(screen.getByLabelText("HIPAA Compliant")).toBeInTheDocument();
  });

  it("never says certified", () => {
    const { container } = render(<ComplianceBadge status="compliant" />);
    expect(container.textContent).not.toMatch(/certif/i);
  });

  it("outlines ready and fills compliant, each from one surface token triple", () => {
    const { container: ready } = render(<ComplianceBadge status="ready" />);
    const readyBadge = ready.firstElementChild as HTMLElement;
    expect(readyBadge.className).toContain("bg-transparent");
    expect(readyBadge.className).toContain("border-[var(--surface-info-border)]");
    expect(readyBadge.className).toContain("text-[var(--surface-info-text)]");

    const { container: compliant } = render(
      <ComplianceBadge status="compliant" />,
    );
    const compliantBadge = compliant.firstElementChild as HTMLElement;
    expect(compliantBadge.className).toContain(
      "bg-[var(--surface-success-bg)]",
    );
    expect(compliantBadge.className).toContain(
      "text-[var(--surface-success-text)]",
    );
  });

  it("paints no hardcoded colours", () => {
    const { container } = render(<ComplianceBadge status="compliant" />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.className).not.toMatch(
      /(?:bg|text|border)-(?:green|blue|red|amber|emerald)-/,
    );
  });

  // The mark is decorative; the label carries the whole claim, so announcing
  // both would say the same thing twice.
  it("hides the brand mark from the accessibility tree", () => {
    const { container } = render(<ComplianceBadge />);
    const mark = container.querySelector("svg");
    expect(mark).not.toBeNull();
    expect(mark?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("renders as a link when href is given", () => {
    render(<ComplianceBadge href="/trust" />);
    const link = screen.getByRole("link", { name: "HIPAA-Ready" });
    expect(link).toHaveAttribute("href", "/trust");
  });

  it("renders as a span without href", () => {
    const { container } = render(<ComplianceBadge />);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });

  it.each(["sm", "md"] as const)("takes the %s size", (size) => {
    const { container } = render(<ComplianceBadge size={size} />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.className).toContain(size === "sm" ? "text-xs" : "text-sm");
  });
});
