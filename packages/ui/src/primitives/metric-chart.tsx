import * as React from "react";
import { chartPresentation } from "../presentation";
import { cn } from "../lib/utils";
import {
  normalizeSeries,
  seriesAreaPath,
  seriesExtent,
  seriesLinePath,
  seriesMean,
  seriesScale,
  type SeriesPointInput,
} from "../lib/series";

export interface ChartReferenceLine {
  value: number;
  label?: string;
  /** Which reading the line applies to for a dual series. A secondary line
   * on a single-reading series is not drawn. */
  series?: "primary" | "secondary";
}

export type MetricChartProps = Omit<React.SVGAttributes<SVGSVGElement>, "points"> & {
  points: SeriesPointInput[];
  /** Accessible name; also rendered as the svg title. */
  title: string;
  /** Unit noun for the generated description ("bpm", "ms"). */
  unit?: string;
  /** Fraction digits for tick labels and the description. Defaults to a
   * maximum of two. */
  decimals?: number;
  referenceLines?: ChartReferenceLine[];
  /** Overrides the generated <desc> summary. */
  description?: string;
  formatValue?: (value: number) => string;
  formatTime?: (at: number) => string;
};

const defaultTimeLabel = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const defaultValueLabel =
  (decimals?: number) =>
  (value: number) =>
    value.toLocaleString(
      undefined,
      decimals === undefined
        ? { maximumFractionDigits: 2 }
        : { minimumFractionDigits: decimals, maximumFractionDigits: decimals },
    );

/**
 * A labelled line chart: y gridlines, x date ticks, optional dashed
 * reference lines and a dotted secondary series for dual readings
 * (`value2`). Hand-rolled SVG, viewBox-scaled, currentColor throughout.
 */
const MetricChart = React.forwardRef<SVGSVGElement, MetricChartProps>(
  (
    {
      points,
      title,
      unit,
      decimals,
      referenceLines,
      description,
      formatValue,
      formatTime,
      className,
      ...props
    },
    ref,
  ) => {
    const series = normalizeSeries(points);
    const width = 680;
    const height = 260;
    const padX = 46;
    const padY = 16;
    const dual = series.some((point) => point.value2 !== undefined);
    const lines = (referenceLines ?? []).filter(
      (line) => line.series !== "secondary" || dual,
    );
    // Plot box runs right of the y-label gutter; x() is box-local, hence +padX.
    const extent = seriesExtent(series, {
      include: lines.map((line) => line.value),
    });
    const plot = seriesScale(extent, width - padX - 8, height, padY);
    const xAt = (at: number) => padX + plot.x(at);
    const yAt = plot.y;
    const { lo, hi, tLo, tHi } = extent;
    const primary = series.map((point) => ({
      x: xAt(point.at),
      y: yAt(point.value),
    }));
    const secondary = series
      .filter((point) => point.value2 !== undefined)
      .map((point) => ({ x: xAt(point.at), y: yAt(point.value2!) }));
    const ticks = Array.from(
      { length: 4 },
      (_, index) => lo + ((hi - lo) * (index + 1)) / 5,
    );
    const xTicks = [tLo, tLo + (tHi - tLo) / 2, tHi];
    const lastPrimary = primary[primary.length - 1];
    const valueLabel = formatValue ?? defaultValueLabel(decimals);
    const timeLabel = formatTime ?? defaultTimeLabel;
    const values = series.map((point) => point.value);
    const describe =
      description ??
      `${title}: ${series.length} readings from ${timeLabel(tLo)} to ${timeLabel(tHi)}, ` +
        `min ${valueLabel(series.length > 0 ? Math.min(...values) : 0)}, ` +
        `max ${valueLabel(series.length > 0 ? Math.max(...values) : 0)}, ` +
        `average ${valueLabel(seriesMean(values) ?? 0)}${unit ? ` ${unit}` : ""}.`;
    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
        className={cn(chartPresentation.root, className)}
        {...props}
      >
        <title>{title}</title>
        <desc>{describe}</desc>
        {series.length > 0 && (
          <>
            {ticks.map((tick) => (
              <g key={tick} className={chartPresentation.axis}>
                <line
                  x1={padX}
                  x2={width - 8}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  stroke="currentColor"
                  strokeWidth="1"
                  className={chartPresentation.gridLine}
                />
                <text
                  x={padX - 8}
                  y={yAt(tick) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="currentColor"
                >
                  {valueLabel(tick)}
                </text>
              </g>
            ))}
            {xTicks.map((tick, index) => (
              <text
                key={tick}
                className={chartPresentation.axis}
                fontSize="11"
                fill="currentColor"
                x={xAt(tick)}
                y={height - 4}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === xTicks.length - 1
                      ? "end"
                      : "middle"
                }
              >
                {timeLabel(tick)}
              </text>
            ))}
            {lines.map((line, index) => (
              <g key={line.label ?? index} className={chartPresentation.axis}>
                <line
                  x1={padX}
                  x2={width - 8}
                  y1={yAt(line.value)}
                  y2={yAt(line.value)}
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeDasharray="5 4"
                  className={chartPresentation.referenceLine}
                />
                {line.label && (
                  <text
                    x={width - 12}
                    y={yAt(line.value) - 5}
                    textAnchor="end"
                    fontSize="11"
                    fill="currentColor"
                  >
                    {line.label}
                  </text>
                )}
              </g>
            ))}
            {primary.length > 1 && (
              <path
                d={seriesAreaPath(primary, yAt(lo))}
                fill="currentColor"
                stroke="none"
                className={cn(chartPresentation.primarySeries, chartPresentation.area)}
              />
            )}
            <path
              d={seriesLinePath(primary)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              className={chartPresentation.primarySeries}
            />
            {secondary.length > 0 && (
              <path
                d={seriesLinePath(secondary)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="2 5"
                className={chartPresentation.secondarySeries}
              />
            )}
            {primary.length === 1 ? (
              <circle
                cx={primary[0]!.x}
                cy={primary[0]!.y}
                r="4"
                fill="currentColor"
                className={chartPresentation.primarySeries}
              />
            ) : (
              lastPrimary && (
                <circle
                  cx={lastPrimary.x}
                  cy={lastPrimary.y}
                  r="3.5"
                  fill="currentColor"
                  className={chartPresentation.primarySeries}
                />
              )
            )}
          </>
        )}
      </svg>
    );
  },
);
MetricChart.displayName = "MetricChart";

export { MetricChart };
