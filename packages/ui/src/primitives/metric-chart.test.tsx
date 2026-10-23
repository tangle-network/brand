import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MetricChart } from "./metric-chart";

afterEach(cleanup);

const DAY = 86_400_000;
const t0 = Date.parse("2026-09-01T07:00:00.000Z");
const points = Array.from({ length: 10 }, (_, index) => ({
  at: t0 + index * 5 * DAY,
  value: 118 + (index % 3) * 4,
  value2: 76 + (index % 2) * 4,
}));

describe("MetricChart", () => {
  it("renders an accessible svg with a generated summary description", () => {
    const { container } = render(
      <MetricChart points={points} title="Blood pressure" unit="mmHg" decimals={0} />,
    );
    const svg = screen.getByRole("img", { name: "Blood pressure" });
    expect(svg.querySelector("title")!.textContent).toBe("Blood pressure");
    const desc = svg.querySelector("desc")!.textContent!;
    expect(desc).toContain("10 readings");
    expect(desc).toContain("min 118");
    expect(desc).toContain("max 126");
    expect(desc).toContain("mmHg");
    // Primary line, area and dotted secondary series.
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(3);
  });

  it("honours a caller-provided description", () => {
    const { container } = render(
      <MetricChart points={points} title="Blood pressure" description="Custom summary." />,
    );
    expect(container.querySelector("desc")!.textContent).toBe("Custom summary.");
  });

  it("draws gridlines, date ticks and labelled reference lines on muted ink", () => {
    const { container } = render(
      <MetricChart
        points={points}
        title="Blood pressure"
        referenceLines={[
          { value: 120, label: "120 systolic" },
          { value: 80, label: "80 diastolic", series: "secondary" },
        ]}
      />,
    );
    expect(screen.getByText("120 systolic")).toBeInTheDocument();
    expect(screen.getByText("80 diastolic")).toBeInTheDocument();
    // Four interior y ticks plus three x date ticks.
    expect(screen.getByText("Sep 1")).toBeInTheDocument();
    const dashed = Array.from(container.querySelectorAll("line")).filter(
      (line) => line.getAttribute("stroke-dasharray") === "5 4",
    );
    expect(dashed).toHaveLength(2);
    for (const line of dashed) expect(line.closest("g")!.getAttribute("class")).toContain("text-muted-foreground");
  });

  it("drops secondary reference lines when the series has no second reading", () => {
    const single = points.map(({ at, value }) => ({ at, value }));
    const { container } = render(
      <MetricChart
        points={single}
        title="Heart rate"
        referenceLines={[{ value: 80, label: "80 diastolic", series: "secondary" }]}
      />,
    );
    expect(screen.queryByText("80 diastolic")).toBeNull();
    expect(
      Array.from(container.querySelectorAll("line")).filter(
        (line) => line.getAttribute("stroke-dasharray") === "5 4",
      ),
    ).toHaveLength(0);
  });

  it("marks a single reading and renders axes only when data exists", () => {
    const { container, rerender } = render(
      <MetricChart points={[points[0]!]} title="Blood pressure" />,
    );
    expect(container.querySelectorAll("circle")).toHaveLength(1);
    rerender(<MetricChart points={[]} title="Blood pressure" />);
    expect(container.querySelectorAll("line")).toHaveLength(0);
    expect(container.querySelectorAll("path")).toHaveLength(0);
    expect(screen.getByRole("img", { name: "Blood pressure" })).toBeInTheDocument();
  });

  it("keeps every stroke and fill on currentColor", () => {
    const { container } = render(<MetricChart points={points} title="Blood pressure" />);
    for (const element of Array.from(container.querySelectorAll("[stroke], [fill]"))) {
      const paint = element.getAttribute("stroke") ?? element.getAttribute("fill");
      expect(["currentColor", "none"]).toContain(paint);
    }
  });

  it("supports caller value and time formatting", () => {
    render(
      <MetricChart
        points={points}
        title="Blood pressure"
        formatValue={(value) => `${value.toFixed(0)}!`}
        formatTime={() => "sometime"}
      />,
    );
    expect(screen.getAllByText("sometime")).toHaveLength(3);
    expect(screen.getAllByText(/!$/).length).toBeGreaterThan(0);
  });

  it("preserves ref, caller attributes and caller classes", () => {
    const ref = React.createRef<SVGSVGElement>();
    const { container } = render(
      <MetricChart ref={ref} points={points} title="Blood pressure" data-testid="bp" className="max-w-md" />,
    );
    expect(ref.current).toBe(container.querySelector("svg"));
    expect(screen.getByTestId("bp").getAttribute("class")).toContain("max-w-md");
  });
});
