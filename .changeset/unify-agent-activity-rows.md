---
"@tangle-network/ui": minor
---

Unify the agent reasoning and tool rows onto one shared row shell: both keep a
consistent semantic lead icon with a small trailing status dot/spinner (status
no longer hijacks the icon), on a calm neutral badge (reasoning carries a subtle
violet accent). Add a per-row content clamp with "Show more/less" for long
reasoning text and tool output, and an opt-in `collapseAfter` on `AgentTimeline`
(threaded as `collapseTimelineAfter` on `ChatContainer`) that collapses the
timeline to the first N steps behind a "Show N more steps" toggle.
