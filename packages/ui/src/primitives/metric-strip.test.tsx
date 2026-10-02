import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Metric, MetricStrip } from "./metric-strip";

afterEach(cleanup);

describe("MetricStrip", () => {
  it("pairs labels, values and qualifiers as native described terms", () => {
    const { container } = render(
      <MetricStrip>
        <Metric label="Balance" value="$248.55" hint="Personal wallet" />
        <Metric label="Runs" value="41" />
      </MetricStrip>,
    );
    expect(screen.getByText("Balance").closest("dt")).not.toBeNull();
    expect(screen.getByText("$248.55").tagName).toBe("DD");
    expect(screen.getByText("Personal wallet").tagName).toBe("DD");
    const dl = container.querySelector("dl")!;
    const permitted = new Set(["DT", "DD", "SCRIPT", "TEMPLATE", "DIV"]);
    for (const child of Array.from(dl.children)) expect(permitted).toContain(child.tagName);
    expect(dl.querySelectorAll("dt")).toHaveLength(2);
    expect(dl.querySelectorAll("dd")).toHaveLength(3);
  });

  it("omits absent qualifiers but preserves a numeric zero qualifier inside dd", () => {
    const { container } = render(
      <MetricStrip>
        <Metric label="Unknown" value="—" />
        <Metric label="Known zero" value={0} hint={0} />
        <Metric label="Unavailable" value={null} hint={false} />
        <Metric label="Empty hint" value="" hint="" />
      </MetricStrip>,
    );
    expect(container.querySelectorAll("dd")).toHaveLength(5);
    expect(screen.getByText("Unknown").closest("div")!.querySelector("dd")!.textContent).toBe("—");
    const zero = screen.getByText("Known zero").closest("div")!;
    expect(Array.from(zero.querySelectorAll("dd")).map((node) => node.textContent)).toEqual(["0", "0"]);
    expect(Array.from(zero.childNodes).every((node) => node.nodeType === Node.ELEMENT_NODE)).toBe(true);
    expect(screen.getByText("Unavailable").closest("div")!.querySelector("dd")!.textContent).toBe("");
  });

  it("does not infer attention from zero; explicit danger retains its pill and value tone", () => {
    const { rerender, container } = render(<MetricStrip><Metric label="Balance" value="$0.00" /></MetricStrip>);
    expect(container.querySelector("svg")).toBeNull();
    rerender(<MetricStrip><Metric label="Balance" value="$0.00" attention={{ tone: "danger", label: "Empty" }} /></MetricStrip>);
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("$0.00").className).toContain("--surface-danger-text");
    expect(container.querySelectorAll("dd")).toHaveLength(1);
    rerender(<MetricStrip><Metric label="Balance" value="$0.00" attention={{ tone: "warning", label: "Review" }} /></MetricStrip>);
    expect(screen.getByText("$0.00").className).not.toContain("--surface-danger-text");
  });

  it("retains the default two / sm:four grid", () => {
    const { container } = render(<MetricStrip><Metric label="Runs" value={0} /></MetricStrip>);
    const dl = container.querySelector("dl")!;
    expect(dl.className.split(" ")).toEqual(expect.arrayContaining(["grid-cols-2", "sm:grid-cols-4"]));
    expect(dl.className).not.toContain("lg:grid-cols");
  });

  it.each([3, 4, 5, 6] as const)("owns the grid and all nonoverlapping row-start guards for %i columns", (columns) => {
    const { container } = render(
      <MetricStrip columns={columns}>
        {Array.from({ length: columns }, (_, i) => <Metric key={i} label={`Metric ${i}`} value={i} />)}
      </MetricStrip>,
    );
    const dl = container.querySelector("dl")!;
    expect(dl).not.toHaveAttribute("columns");
    expect(dl.className).toContain("max-sm:[&>div:not(:nth-child(2n+1))]:border-l");
    if (columns <= 4) {
      expect(dl.className).toContain(`sm:grid-cols-${columns}`);
      expect(dl.className).toContain(`sm:[&>div:not(:nth-child(${columns}n+1))]:border-l`);
    } else {
      expect(dl.className).toContain("sm:grid-cols-3");
      expect(dl.className).toContain("sm:max-lg:[&>div:not(:nth-child(3n+1))]:border-l");
      expect(dl.className).toContain(`lg:grid-cols-${columns}`);
      expect(dl.className).toContain(`lg:[&>div:not(:nth-child(${columns}n+1))]:border-l`);
    }
    expect(dl.className).not.toContain("border-l-0");
    for (const item of Array.from(dl.children)) expect(item.className).not.toContain("nth-child");
  });

  it("does not give a standalone Metric a strip divider", () => {
    const { container } = render(<Metric label="Runs" value={0} />);
    expect(container.firstElementChild!.className).not.toContain("border-l");
  });

  it("wraps full labels, values and qualifiers without relying on a mouse title", () => {
    render(<MetricStrip><Metric label="Very long account label without loss" value="$1,284,003.10" hint="Personal wallet (0x1234abcd5678efgh)" /></MetricStrip>);
    for (const text of ["Very long account label without loss", "$1,284,003.10", "Personal wallet (0x1234abcd5678efgh)"]) {
      const node = screen.getByText(text);
      expect(node.className).toContain("[overflow-wrap:anywhere]");
      expect(node.className).not.toContain("truncate");
    }
    expect(screen.getByText("$1,284,003.10")).toHaveAttribute("title", "$1,284,003.10");
    expect(screen.getByText("Personal wallet (0x1234abcd5678efgh)")).toHaveAttribute("title", "Personal wallet (0x1234abcd5678efgh)");
  });

  it("preserves refs, attributes, caller classes and fragment/conditional DOM order", () => {
    const strip = React.createRef<HTMLDListElement>();
    const item = React.createRef<HTMLDivElement>();
    const { container } = render(
      <MetricStrip ref={strip} aria-label="Usage" className="mb-6 sm:grid-cols-3">
        <><Metric ref={item} data-testid="first" className="max-sm:col-span-2 max-sm:border-b" label="Spend" value={0} /></>
        {false && <Metric label="Hidden" value={0} />}
        <Metric className="max-sm:border-l-0!" label="Calls" value={0} />
        <Metric className="max-sm:border-l!" label="Average" value="—" />
      </MetricStrip>,
    );
    expect(strip.current).toBe(container.querySelector("dl"));
    expect(strip.current).toHaveAttribute("aria-label", "Usage");
    expect(item.current).toBe(screen.getByTestId("first"));
    expect(item.current!.className).toContain("max-sm:col-span-2");
    expect(strip.current!.className).toContain("sm:grid-cols-3");
    expect(strip.current!.className).not.toContain("sm:grid-cols-4");
    expect(Array.from(strip.current!.querySelectorAll("dt")).map((node) => node.textContent)).toEqual(["Spend", "Calls", "Average"]);
  });
});
