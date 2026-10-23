---
"@tangle-network/ui": minor
---

Add hand-rolled SVG chart primitives. `SeriesSparkline` and `MetricChart` (exported from `@tangle-network/ui/primitives`) draw viewBox-scaled line charts with `currentColor` against theme token classes — no chart dependency, no hardcoded hues, dark-mode correct. `MetricChart` adds y gridlines, x date ticks, dual-series (`value2`) support and dashed reference lines. The React-free series math (`normalizeSeries`, `seriesExtent`, `seriesScale`, `periodDelta`, `seriesMean`, path builders) lives in `src/lib/series.ts` and is re-exported from primitives; `chartPresentation` joins the shared presentation map. Period deltas are measured relative to the latest measurement, never the wall clock. Named `SeriesSparkline` to stay distinct from the sample-index `Sparkline` already exported by `@tangle-network/charts`.
