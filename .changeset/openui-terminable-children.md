---
"@tangle-network/ui": patch
---

Let model tool-schema converters accept the OpenUI node schema: container `children` no longer declares a nonempty minimum, which formed a required recursive loop that opencode rejected for `render_ui`. The persistence gate still rejects an empty stack, grid, or card children list.
