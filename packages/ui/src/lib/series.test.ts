import { describe, expect, it } from "vitest";
import {
  normalizeSeries,
  periodDelta,
  seriesAreaPath,
  seriesExtent,
  seriesLinePath,
  seriesMean,
  seriesScale,
  type SeriesPoint,
} from "./series";

const DAY = 86_400_000;

describe("normalizeSeries", () => {
  it("parses epoch, ISO and Date times, drops non-finite readings and sorts", () => {
    const points = normalizeSeries([
      { at: "2026-10-21T07:00:00.000Z", value: 63 },
      { at: 1_000, value: 61 },
      { at: new Date("2026-10-20T07:00:00.000Z"), value: 62, value2: 40 },
      { at: "not a date", value: 99 },
      { at: 2_000, value: Number.NaN },
      { at: 3_000, value: 65, value2: Number.POSITIVE_INFINITY },
    ]);
    expect(points.map((point) => point.value)).toEqual([61, 65, 62, 63]);
    expect(points[0]!.at).toBe(1_000);
    // A non-finite second reading drops value2, not the point.
    expect(points[1]!.value2).toBeUndefined();
    expect(points[2]!.value2).toBe(40);
    for (let i = 1; i < points.length; i += 1) {
      expect(points[i]!.at).toBeGreaterThanOrEqual(points[i - 1]!.at);
    }
  });

  it("returns an empty series for empty input", () => {
    expect(normalizeSeries([])).toEqual([]);
  });
});

describe("seriesExtent", () => {
  const points: SeriesPoint[] = [
    { at: 10 * DAY, value: 60 },
    { at: 20 * DAY, value: 80 },
    { at: 30 * DAY, value: 70, value2: 45 },
  ];

  it("spans both readings with twelve percent padding by default", () => {
    const extent = seriesExtent(points);
    const span = 80 - 45;
    expect(extent.lo).toBeCloseTo(45 - span * 0.12);
    expect(extent.hi).toBeCloseTo(80 + span * 0.12);
    expect(extent.tLo).toBe(10 * DAY);
    expect(extent.tHi).toBe(30 * DAY);
  });

  it("widens the domain to cover included reference values", () => {
    const extent = seriesExtent(points, { include: [95, 30] });
    expect(extent.hi).toBeGreaterThanOrEqual(95);
    expect(extent.lo).toBeLessThanOrEqual(30);
  });

  it("honours an explicit padding of zero", () => {
    const extent = seriesExtent(points, { padding: 0 });
    expect(extent.lo).toBe(45);
    expect(extent.hi).toBe(80);
  });

  it("opens up a degenerate value span so a flat series still centres", () => {
    const extent = seriesExtent([
      { at: DAY, value: 50 },
      { at: 2 * DAY, value: 50 },
    ]);
    expect(extent.lo).toBeLessThan(50);
    expect(extent.hi).toBeGreaterThan(50);
  });

  it("opens up a degenerate time span for a single reading", () => {
    const extent = seriesExtent([{ at: DAY, value: 50 }]);
    expect(extent.tHi - extent.tLo).toBe(24 * 3_600_000);
    expect((extent.tLo + extent.tHi) / 2).toBe(DAY);
  });

  it("returns a usable default extent for an empty series", () => {
    const extent = seriesExtent([]);
    expect(extent.lo).toBeLessThan(extent.hi);
    expect(extent.tLo).toBeLessThan(extent.tHi);
  });
});

describe("seriesScale", () => {
  it("maps extent corners to the padded box corners", () => {
    const extent = { lo: 0, hi: 10, tLo: 0, tHi: 100 };
    const scale = seriesScale(extent, 200, 100, 10);
    expect(scale.x(0)).toBe(10);
    expect(scale.x(100)).toBe(190);
    expect(scale.y(0)).toBe(90);
    expect(scale.y(10)).toBe(10);
    expect(scale.x(50)).toBeCloseTo(100);
    expect(scale.y(5)).toBeCloseTo(50);
  });
});

describe("seriesMean", () => {
  it("averages finite values and ignores non-finite ones", () => {
    expect(seriesMean([2, 4, 6])).toBe(4);
    expect(seriesMean([2, Number.NaN, 4])).toBe(3);
  });

  it("returns null when there is nothing to average", () => {
    expect(seriesMean([])).toBeNull();
  });
});

describe("periodDelta", () => {
  const latest = 60 * DAY;
  const points: SeriesPoint[] = [
    { at: latest - 45 * DAY, value: 80 }, // prior window
    { at: latest - 40 * DAY, value: 60 }, // prior window
    { at: latest - 10 * DAY, value: 50 }, // recent window
    { at: latest, value: 70 }, // recent window
  ];

  it("measures both windows back from the latest measurement, not the wall clock", () => {
    const result = periodDelta(points, 30 * DAY)!;
    expect(result.current).toBe(60);
    expect(result.previous).toBe(70);
    expect(result.delta).toBe(-10);
  });

  it("reports a null delta when the prior window has no data", () => {
    const result = periodDelta(points.slice(2), 30 * DAY)!;
    expect(result.current).toBe(60);
    expect(result.previous).toBeNull();
    expect(result.delta).toBeNull();
  });

  it("excludes readings exactly on the window boundary from the recent window", () => {
    const boundary: SeriesPoint[] = [
      { at: latest - 30 * DAY, value: 100 },
      { at: latest, value: 50 },
    ];
    const result = periodDelta(boundary, 30 * DAY)!;
    expect(result.current).toBe(50);
    expect(result.previous).toBe(100);
  });

  it("returns null for an empty series", () => {
    expect(periodDelta([], 30 * DAY)).toBeNull();
  });
});

describe("seriesLinePath / seriesAreaPath", () => {
  const placed = [
    { x: 0, y: 10 },
    { x: 5, y: 0 },
    { x: 10, y: 10 },
  ];

  it("builds a move/line path", () => {
    expect(seriesLinePath(placed)).toBe("M0.00,10.00 L5.00,0.00 L10.00,10.00");
  });

  it("closes the area path along the baseline", () => {
    expect(seriesAreaPath(placed, 12)).toBe(
      "M0.00,10.00 L5.00,0.00 L10.00,10.00L10.00,12L0.00,12Z",
    );
  });

  it("draws no area for fewer than two points", () => {
    expect(seriesAreaPath([{ x: 0, y: 0 }], 12)).toBe("");
  });
});
