# Component Audit

This document tracks what in `@tangle-network/ui` is canonical, adapter-only, or suspect. The goal is to keep the package useful without letting old demo UI become the brand.

## Current Judgment

`RunGroup` and `InlineToolItem` are the useful center of the run UI. They model real agent transcript states and are referenced by product work. `ToolCallStep` and `ToolCallFeed` should be treated as compatibility adapters until consumers move to the canonical row.

## Keep

`packages/ui/src/run/run-group.tsx`

- Keep as the transcript container.
- It should render agent output, tool calls, reasoning, OpenUI artifacts, and collapsed summaries.
- Remove decorative avatar/status treatments when they do not carry useful state.

`packages/ui/src/run/inline-tool-item.tsx`

- Keep as the canonical tool-call row.
- It can show icon, title, detail, duration, status, expansion, and actions.
- It should avoid loud uppercase pills except for true error or running states where the status is necessary.

`packages/ui/src/chat/chat-message.tsx`

- Keep if it remains a simple message bubble primitive.
- Sender labels are acceptable as actual chat metadata, but should not use marketing-style uppercase tracking.

## Adapter-Only

`packages/ui/src/run/tool-call-step.tsx`

- Currently maps the older flat `label/status/detail/output` props into `InlineToolItem`.
- Keep only until external consumers are migrated.
- Do not expand it into another bespoke row.

`packages/ui/src/run/tool-call-feed.tsx`

- Keep only if a product still needs the feed parser.
- If it is not imported by active apps, delete it with the stories.

## Suspect Story Patterns

`packages/ui/src/run/tool-call-step.stories.tsx`

- Shows grouped phase labels such as "Exploration" and "Test cycle."
- Shows all tool types as a taxonomy panel.
- Removed from Storybook. Keep the source adapter only while consumers still import it.

`packages/ui/src/run/tool-call-feed.stories.tsx`

- Removed from Storybook. The `ToolCallFeed` source stays because `tax-agent` still imports it.

`packages/ui/src/stories/theme-showcase.stories.tsx`

- Useful for token testing; it now uses `InlineToolItem` instead of hand-rolled rows.
- The theme names and green "Arena" direction should not imply a production site identity.

## Deletion Gate

Before deleting a public export:

1. Search active repos for imports:

   ```sh
   rg -n "ToolCallStep|ToolCallFeed|InlineToolItem|RunGroup" ~/webb -g '!**/node_modules/**' -g '!**/dist/**'
   ```

2. Migrate active first-party consumers to `RunGroup` or `InlineToolItem`.
3. Remove adapter stories first, then adapter exports in the next breaking release.
4. Add a changeset when package exports change.

## Immediate Cleanup Targets

- Migrate `tax-agent` from `ToolCallFeed` if we want to remove that export.
- Replace `AgentTimeline` internals with `InlineToolItem` directly if we want to remove the `ToolCallStep` adapter.
- Remove adapter exports in a breaking-release PR after consumers migrate.
