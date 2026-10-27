---
"@tangle-network/brand": minor
---

Per-user accent scopes. `data-accent="violet" | "orange" | "teal" | "blue" | "pink" | "brown" | "cyan" | "lime"` on `<html>` or any theme boundary rebinds the four indigo roles (fill, mark, line, ink) and the ring to that category's hue, in both modes and inside every named theme; buttons, focus, selection, interaction states, wells, gradients and the chart accent follow, while planes, body ink and status stay the theme's. `gen-ladders.mjs` solves each hue's roles (`--tone-<hue>-{fill,ring,mark,line,ink}`): the fill carries white at 4.5:1, the ink clears 4.5:1 on the page, the card and every selected tint, the line and the focus border clear 3:1. No picker ships; a product sets the attribute.

`tangle-drift`'s `settings_layout` counts a settings page as composed when it binds the shared frame with `bindSettingsNav` from `@tangle-network/ui/presentation`, as a server-rendered host does, as well as when it imports `@tangle-network/agent-app/settings-react`.
