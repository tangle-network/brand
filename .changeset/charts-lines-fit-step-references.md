---
"@tangle-network/charts": minor
---

`Lines` draws score climbs, not only counts. `domain="fit"` spans the data and the references with a margin instead of starting at 0 (scores in a 0.91–0.94 band were flat lines). A `step` series draws a running-record staircase. `references` draw labelled horizontal lines (`solid`, `dashed`, `dotted`) for a baseline, the current best, or a target. A `dots` series takes a per-point colour (`pointColor`) and `onSelect`, which makes each mark a keyboard-reachable button. `ariaLabel` names the chart, and the readout's title follows `axis` (the nearest point's label), so a chart indexed by submission reads "#12" instead of a date. Every option is optional and the defaults render as in 0.4.0. New exports: `linesDomain`, `stepPoints`, `LinesSeries`, `LinesReference`. This is what Solve's leaderboard hill-climb chart needs to drop echarts.
