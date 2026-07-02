---
"@tangle-network/ui": major
---

Flip the transcript convergence: RunGroup adopts AgentTimeline's look, not the reverse. 8.1 made AgentTimeline fold tool activity into RunGroup's single filled box (`AssistantRunShell`); that boxed all steps into one card and lost the timeline's separated, distinct rows. Reverted.

- **`RunGroup`** now renders as separated steps on a timeline spine (connector line + accent dots, one row per tool/reasoning/text part) with a quiet collapsible header (chevron · label · summary · status) — no wrapping `bg-card` box, and consecutive tools are no longer joined into one block. It reads like `AgentTimeline`, plus collapse.
- **`AgentTimeline`** is restored to its prior flat, separated rendering (no tool-run folding). The `collapsibleToolRuns` / `defaultToolRunsOpen` props added in 8.1 are removed.
- **`AssistantRunShell`** (added in 8.1) is removed — the boxed shell is gone.

BREAKING: `AssistantRunShell` / `AssistantRunShellProps` are no longer exported, and `AgentTimeline` drops the `collapsibleToolRuns` / `defaultToolRunsOpen` props.
