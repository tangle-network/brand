import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SeriesSparkline } from "./series-sparkline";

afterEach(cleanup);

const points = [
  { at: "2026-10-19T07:00:00.000Z", value: 62 },
  { at: "2026-10-20T07:00:00.000Z", value: 60 },
  { at: "2026-10-21T07:00:00.000Z", value: 63 },
];

describe("SeriesSparkline", () => {
  it("renders an accessible svg with line, area and a last-point marker", () => {
    const { container } = render(<SeriesSparkline points={points} label="Resting heart rate" />);
    const svg = screen.getByRole("img", { name: "Resting heart rate" });
    expect(svg.tagName).toBe("svg");
    expect(svg.querySelector("title")!.textContent).toBe("Resting heart rate");
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0]!.getAttribute("d")).toMatch(/^M.*Z$/);
    expect(paths[1]!.getAttribute("d")).toMatch(/^M/);
    expect(paths[1]!.getAttribute("d")).not.toContain("Z");
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("keeps every stroke and fill on currentColor against token classes", () => {
    const { container } = render(<SeriesSparkline points={points} label="Resting heart rate" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toContain("text-primary");
    for (const element of Array.from(container.querySelectorAll("[stroke], [fill]"))) {
      const paint = element.getAttribute("stroke") ?? element.getAttribute("fill");
      expect(["currentColor", "none"]).toContain(paint);
    }
  });

  it("draws only the marker for a single reading and nothing for none", () => {
    const { container, rerender } = render(
      <SeriesSparkline points={[points[0]!]} label="Resting heart rate" />,
    );
    expect(container.querySelectorAll("path")).toHaveLength(0);
    expect(container.querySelectorAll("circle")).toHaveLength(1);
    rerender(<SeriesSparkline points={[]} label="Resting heart rate" />);
    expect(container.querySelectorAll("circle")).toHaveLength(0);
  });

  it("preserves ref, caller attributes and caller classes", () => {
    const ref = React.createRef<SVGSVGElement>();
    const { container } = render(
      <SeriesSparkline ref={ref} points={points} label="HRV" data-testid="hrv" className="h-6" />,
    );
    expect(ref.current).toBe(container.querySelector("svg"));
    expect(screen.getByTestId("hrv").getAttribute("class")).toContain("h-6");
  });
});
