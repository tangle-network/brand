---
"@tangle-network/ui": patch
---

`focusFieldWithin` lights the container only while the field inside it has focus. It used `:focus-within`, so clicking a composer's send button drew the field ring around the whole composer, and tabbing to that button showed two indicators.
