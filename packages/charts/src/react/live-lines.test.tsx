// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Lines, linesDomain, stepPoints } from "./live.js";

// jsdom has no layout: report a 600px-wide plot so the SVG draws.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      this.callback([{ target, contentRect: { width: 600 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

const day = (n: number) => Date.UTC(2026, 9, n);

describe("linesDomain", () => {
  it("starts at 0 by default, as 0.4.0 did", () => {
    expect(linesDomain([3, 7])).toEqual({ lo: 0, hi: 8, ticks: [0, 4, 8] });
  });
  it("fits a narrow score band with an 8% margin", () => {
    const { lo, hi, ticks } = linesDomain([0.91, 0.94], "fit");
    expect(lo).toBeCloseTo(0.9076, 4);
    expect(hi).toBeCloseTo(0.9424, 4);
    expect(ticks[1]).toBeCloseTo(0.925, 4);
  });
  it("gives a flat series a band instead of a zero-height axis", () => {
    const { lo, hi } = linesDomain([2, 2], "fit");
    expect(hi - lo).toBeGreaterThan(0);
  });
});

describe("stepPoints", () => {
  it("holds each value until the next point", () => {
    expect(stepPoints([[0, 1], [2, 3], [5, 4]])).toEqual([[0, 1], [2, 1], [2, 3], [5, 3], [5, 4]]);
  });
});

describe("Lines", () => {
  it("keeps the 0.4.0 rendering when no new option is passed", () => {
    const { container } = render(<Lines series={[{ name: "runs", color: "#123", points: [[day(1), 3], [day(2), 7]] }]} />);
    const axis = [...container.querySelectorAll("text.ov-axis")].map((t) => t.textContent);
    expect(axis).toContain("0");
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("runs");
    expect(container.querySelectorAll("[data-reference]")).toHaveLength(0);
  });

  it("draws a fitted staircase, labelled references and selectable coloured marks", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Lines
        domain="fit"
        ariaLabel="Score over time"
        format={(v) => v.toFixed(3)}
        references={[
          { label: "Baseline", value: 0.9, dash: "dashed" },
          { label: "Target", value: 0.95, dash: "dotted" },
        ]}
        series={[
          { name: "Record", color: "#0a0", step: true, points: [[day(1), 0.91], [day(3), 0.93]] },
          { name: "Submissions", color: "#888", dots: true, points: [[day(1), 0.91], [day(2), 0.92], [day(3), 0.93]], pointColor: (i) => ["#a00", "#0a0", "#00a"][i]!, onSelect, label: () => "alice" },
        ]}
      />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("Score over time");
    // The axis spans the references too, and does not start at 0.
    const ticks = [...container.querySelectorAll("text.ov-axis")].map((t) => t.textContent);
    expect(ticks).not.toContain("0.000");
    expect([...container.querySelectorAll("[data-reference]")].map((g) => g.textContent)).toEqual(["Baseline · 0.900", "Target · 0.950"]);
    expect(container.querySelector('[data-reference="Target"] line')?.getAttribute("stroke-dasharray")).toBe("2 4");
    // Staircase: 2 points become 3 vertices.
    expect(container.querySelector("polyline")?.getAttribute("points")?.split(" ")).toHaveLength(3);
    const marks = [...container.querySelectorAll("circle.ov-point")];
    expect(marks.map((m) => m.getAttribute("fill"))).toEqual(["#a00", "#0a0", "#00a"]);
    expect(marks[1]!.getAttribute("aria-label")).toBe("alice: 0.920");
    fireEvent.click(marks[1]!);
    fireEvent.keyDown(marks[2]!, { key: "Enter" });
    expect(onSelect.mock.calls).toEqual([[1], [2]]);
  });

  it("titles the readout with the axis label of the nearest point", () => {
    const { container } = render(
      <Lines axis={(i) => `#${i}`} series={[{ name: "score", color: "#123", points: [[1, 0.5], [2, 0.6], [3, 0.7]] }]} />,
    );
    const plot = container.querySelector(".ov-plot") as HTMLElement;
    plot.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 200, right: 600, bottom: 200, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.mouseMove(plot, { clientX: 590 });
    expect(container.querySelector(".ov-tip strong")?.textContent).toBe("#3");
  });
});
