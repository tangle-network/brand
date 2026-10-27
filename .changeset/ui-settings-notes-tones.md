---
"@tangle-network/ui": minor
---

Settings gaps found while adopting the settings system (#414, #415, #422):

- `SettingsNote`: a line or block of a `SettingsSection` that is not a row (an empty list, a loading line, a notice, a refusal, or a figure such as a `MetricStrip`), on the rows' gutters and divider, with `tone` (`default`, `muted`, `warning`, `danger`) and `role`. Warning and danger lead with a glyph.
- `SettingsListItem` takes `tone` (a `StatusTone`): the state leads with the tone's glyph in its ink, and its text keeps its colour.
- List titles and meta, and row values, keep a URL, address or event name whole: it moves to the next line, and one wider than its column breaks only at its punctuation.
- `MetricStrip columns={2}`, one column below `sm`.
- `bindSettingsNav` in `@tangle-network/ui/presentation` binds PageShell's settings nav in any host, React or server-rendered. A plain click on a link to another document marks it current at once; a back-forward restore shows the link the page left.
- A host whose page scrolls under its own sticky header sets `--tangle-settings-sticky-top`, and the settings nav sticks below it.
- A labelled `CopyButton` uses the header's sans 14px type instead of the code font.
- `Progress` takes `tone` (`neutral`, `success`, `warning`, `danger`), filled with that status ink.
