/**
 * src/lib/series.ts — pure time-series math shared by the chart primitives.
 * No React, no DOM: unit-tested directly. All periods are relative to the
 * LATEST measurement in the series, never to the wall clock, so a seeded
 * demo or a backfilled import never goes stale.
 */

/** A point as callers supply it: `at` accepts epoch ms, ISO text or a Date. */
export interface SeriesPointInput {
  at: number | string | Date;
  value: number;
  /** Second reading for dual series (diastolic next to systolic). */
  value2?: number;
}

/** A normalized point: finite numbers, epoch-ms time, ascending order. */
export interface SeriesPoint {
  at: number;
  value: number;
  value2?: number;
}

const asTime = (at: number | string | Date): number | null => {
  const time =
    at instanceof Date ? at.getTime() : typeof at === "number" ? at : Date.parse(at);
  return Number.isFinite(time) ? time : null;
};

/** Drop non-finite readings and sort by measurement time. */
export function normalizeSeries(
  points: readonly SeriesPointInput[],
): SeriesPoint[] {
  const normalized: SeriesPoint[] = [];
  for (const point of points) {
    const at = asTime(point.at);
    if (at === null || !Number.isFinite(point.value)) continue;
    const { value2 } = point;
    normalized.push(
      value2 !== undefined && Number.isFinite(value2)
        ? { at, value: point.value, value2 }
        : { at, value: point.value },
    );
  }
  return normalized.sort((a, b) => a.at - b.at);
}

export interface SeriesExtent {
  /** Padded value domain. */
  lo: number;
  hi: number;
  /** Time domain, never degenerate. */
  tLo: number;
  tHi: number;
}

const TWELVE_HOURS_MS = 12 * 3_600_000;

/**
 * Value and time extents across both readings of every point. The value
 * domain is padded by `padding` (fraction of the span, default 0.12) and
 * widened to cover `include`d values (reference lines). Degenerate spans
 * open up so a flat or single-reading series still centres.
 */
export function seriesExtent(
  points: readonly SeriesPoint[],
  options: { padding?: number; include?: readonly number[] } = {},
): SeriesExtent {
  const values = [
    ...points.flatMap((point) =>
      point.value2 === undefined ? [point.value] : [point.value, point.value2]
    ),
    ...(options.include ?? []),
  ];
  let lo = values.length > 0 ? Math.min(...values) : 0;
  let hi = values.length > 0 ? Math.max(...values) : 1;
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * (options.padding ?? 0.12);
  lo -= pad;
  hi += pad;
  let tLo = points.length > 0 ? points[0]!.at : 0;
  let tHi = points.length > 0 ? points[points.length - 1]!.at : 1;
  if (tLo === tHi) {
    tLo -= TWELVE_HOURS_MS;
    tHi += TWELVE_HOURS_MS;
  }
  return { lo, hi, tLo, tHi };
}

export interface SeriesScale {
  x: (at: number) => number;
  y: (value: number) => number;
  extent: SeriesExtent;
}

/** Project an extent into a `width` × `height` box with `pad` inset. */
export function seriesScale(
  extent: SeriesExtent,
  width: number,
  height: number,
  pad: number,
): SeriesScale {
  const { lo, hi, tLo, tHi } = extent;
  return {
    extent,
    x: (at) => pad + ((at - tLo) / (tHi - tLo)) * (width - 2 * pad),
    y: (value) => height - pad - ((value - lo) / (hi - lo)) * (height - 2 * pad),
  };
}

export interface PeriodDelta {
  /** Mean of the latest `windowMs` of data, ending at the last measurement. */
  current: number;
  /** Mean of the window before that, when such data exists. */
  previous: number | null;
  /** `current - previous`, or null without a populated prior window. */
  delta: number | null;
}

/** Mean of finite values, or null when there is nothing to average. */
export function seriesMean(values: readonly number[]): number | null {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

/**
 * Compare the latest `windowMs` of primary readings against the window
 * before it. Both windows end at the LATEST measurement, never the wall
 * clock. Returns null for an empty series.
 */
export function periodDelta(
  points: readonly SeriesPoint[],
  windowMs: number,
): PeriodDelta | null {
  if (points.length === 0) return null;
  const latest = points[points.length - 1]!.at;
  const recentStart = latest - windowMs;
  const previousStart = latest - 2 * windowMs;
  const recent = points
    .filter((point) => point.at > recentStart)
    .map((point) => point.value);
  const previous = points
    .filter((point) => point.at > previousStart && point.at <= recentStart)
    .map((point) => point.value);
  const current = seriesMean(recent)!;
  const previousMean = seriesMean(previous);
  return {
    current,
    previous: previousMean,
    delta: previousMean !== null ? current - previousMean : null,
  };
}

/** Polyline path data for already-projected points. */
export function seriesLinePath(points: ReadonlyArray<{ x: number; y: number }>): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    )
    .join(" ");
}

/** Closed area path down to `baseline`, empty for fewer than two points. */
export function seriesAreaPath(
  points: ReadonlyArray<{ x: number; y: number }>,
  baseline: number,
): string {
  if (points.length < 2) return "";
  return `${seriesLinePath(points)}L${points[points.length - 1]!.x.toFixed(2)},${baseline}L${points[0]!.x.toFixed(2)},${baseline}Z`;
}
