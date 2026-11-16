---
"@tangle-network/ui": patch
---

SettingsRow's inline layout no longer squeezes a short label to nothing beside a wide control outside a settings section: the label cell keeps its minimum content width (normally the label's longest word) and the control column gives up width instead. Wide rows are unchanged.
