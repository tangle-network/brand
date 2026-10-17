---
"@tangle-network/ui": minor
---

Add the settings atoms to `@tangle-network/ui/primitives`, so every product's settings page draws from one owner:

- `Field` and `fieldMessageId`, promoted from Agent App's profile form with the same API. The info tip is a bare `Button` with a 44px hit area on coarse pointers.
- `SettingsRow`: `inline`, `compact` and `stacked` layouts; a save status after the label, announced politely; an error (with optional Retry) or a lock reason that replaces the description, describes the control and marks it invalid. No className sizing hooks.
- `SettingsSection`: a `Card` with a 16px title, an anchor `id`, a `danger` tone, top-right actions and a footer on the muted plane.
- `SettingsList` and `SettingsListItem`: subgrid-aligned leading, state, action and menu columns; destructive actions go in the ⋯ menu, where an unavailable item stays focusable with its reason.

Rows and lists answer to their card's width: below 34rem rows stack and list items become two lines with the state under the title.

`PageShell` gains `measure="settings"` and a `header` slot. The settings measure is a 48rem column of cards with a sticky 13rem section column once its frame is 60rem wide, and a sticky 56px tab strip below that which keeps the current tab in view by scrolling the strip only. The reading layout and every existing export are unchanged.
