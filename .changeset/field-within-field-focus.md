---
"@tangle-network/ui": patch
---

`focusFieldWithin` lights the container only while a field inside it has focus: a text input, textarea, select or contenteditable editor. It used `:focus-within`, so clicking a composer's send button drew the field ring around the whole composer, and tabbing to that button showed two indicators. A focused button, checkbox or button-type input inside the container now shows only its own ring. Because the rule keys off `:has()`, a consumer's `focus-within:*` class does not override it; compose your own classes for a different container focus.
