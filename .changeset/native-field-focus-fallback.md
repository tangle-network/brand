---
"@tangle-network/brand": patch
---

`globals.css` gives a native text field that styles no focus of its own a fallback: a 1px `--focus-border` line over its border, in place of the browser's blue outline. It covers `input` (except button-like, checkbox, radio, range, colour, file and hidden types), `select` and `textarea`, on `:focus-visible`, in the base layer. Any outline utility on the field, such as `outline-none` or ui's `focusField`, still wins. The fallback has no halo, so a field that hands its focus to a container and clears its outline shows nothing extra.
