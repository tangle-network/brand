---
"@tangle-network/ui": minor
---

Unify the agent reasoning and tool rows onto one shared row shell: both keep a
consistent semantic lead icon with a small trailing status dot/spinner (status
no longer hijacks the icon), on a calm neutral badge that is uniform across
reasoning and tool rows. Expanded and open rows read as the same surface as
their collapsed siblings (no background elevation), the reasoning body inherits
the card surface and stays readable in dark mode, and the timeline spine dot is
centered on card rows. Add a per-row content clamp with "Show more/less" for
long reasoning text and tool output, and an opt-in `collapseAfter` on
`AgentTimeline` (threaded as `collapseTimelineAfter` on `ChatContainer`) that
collapses the timeline to the first N steps behind a "Show N more steps" toggle.
