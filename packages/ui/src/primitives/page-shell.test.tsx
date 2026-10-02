import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("ports Sandbox's width, gutters and rhythm without imposing a landmark or grid", () => {
    const { container } = render(<PageShell><p>Content</p></PageShell>);
    const shell = container.firstElementChild;
    expect(shell?.tagName).toBe("DIV");
    expect(shell).toHaveClass("mx-auto", "max-w-6xl", "space-y-8", "px-6", "py-8", "lg:px-8");
    expect(shell).not.toHaveAttribute("role");
    expect(shell).not.toHaveClass("grid");
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("allows a caller-owned fluid layout without introducing shell behavior", () => {
    const { container } = render(<main><PageShell className="mx-0 max-w-none px-0 lg:px-0"><p>Workbench</p></PageShell></main>);
    const shell = container.querySelector("main > div");
    expect(shell).toHaveClass("mx-0", "max-w-none", "px-0", "lg:px-0");
    expect(shell).not.toHaveClass("mx-auto", "max-w-6xl", "px-6", "lg:px-8");
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
