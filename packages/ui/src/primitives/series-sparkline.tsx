import * as React from "react";
import { chartPresentation } from "../presentation";
import { cn } from "../lib/utils";
import {
  normalizeSeries,
  seriesAreaPath,
  seriesExtent,
  seriesLinePath,
  seriesScale,
  type SeriesPointInput,
} from "../lib/series";

export type SeriesSparklineProps = Omit<React.SVGAttributes<SVGSVGElement>, "points"> & {
  points: SeriesPointInput[];
  /** Accessible name; also rendered as the svg title. */
  label: string;
};

/** Inline trend glyph: viewBox-scaled, currentColor against `text-primary`. */
const SeriesSparkline = React.forwardRef<SVGSVGElement, SeriesSparklineProps>(
  ({ points, label, className, ...props }, ref) => {
    const series = normalizeSeries(points);
    const width = 120;
    const height = 36;
    const pad = 3;
    const scale = seriesScale(seriesExtent(series), width, height, pad);
    const placed = series.map((point) => ({
      x: scale.x(point.at),
      y: scale.y(point.value),
    }));
    const last = placed[placed.length - 1];
    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className={cn(chartPresentation.sparkline, className)}
        {...props}
      >
        <title>{label}</title>
        {placed.length > 1 && (
          <>
            <path
              d={seriesAreaPath(placed, height - pad)}
              fill="currentColor"
              className={chartPresentation.area}
              stroke="none"
            />
            <path
              d={seriesLinePath(placed)}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
        {last && <circle cx={last.x} cy={last.y} r="2" fill="currentColor" />}
      </svg>
    );
  },
);
SeriesSparkline.displayName = "SeriesSparkline";

export { SeriesSparkline };
