---
"@tangle-network/ui": patch
---

SettingsRow's inline layout no longer squeezes a short label to nothing beside a wide control outside a settings section: the label keeps the width of its longest word and the control column gives up width instead, so narrow rows neither clip the label nor overflow.
