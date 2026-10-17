---
"@tangle-network/ui": minor
---

Add the settings atoms to `@tangle-network/ui/primitives`, so every product's settings page draws from one owner:

- `Field` and `fieldMessageId`, promoted from Agent App's profile form with the same API. The info tip is a bare `Button` with a 44px hit area on coarse pointers.
- `SettingsRow`: `inline`, `compact` and `stacked` layouts; a save status after the label, announced politely; an error (with optional Retry) or a lock reason that replaces the description, describes the control and marks it invalid. No className sizing hooks.
- `SettingsSection`: a `Card` with a 16px title, an anchor `id`, a `danger` tone, top-right actions and a footer on the muted plane.
- `SettingsList` and `SettingsListItem`: subgrid-aligned leading, state, action and menu columns. The item's one at-rest `action` is an outline button, so it never reads as the state; with a `disabledReason` it stays focusable, does nothing and shows the reason under the meta. Destructive actions go in the ⋯ menu, where an unavailable item stays focusable with its reason.

`Button` gains `variant="destructive-outline"` for a destructive action at rest, such as a danger section's "Delete project…". `Avatar` gains `size` (`sm` 32px, `md` 40px by default). `Switch` keeps its 36 x 20 track and gets a 44px hit area on coarse pointers, like the info tip.

Rows and lists answer to their card's width: below 34rem rows stack and list items become two lines with the state under the title.

`PageShell` gains `measure="settings"` and a `header` slot. The settings measure is a 48rem column of cards with a sticky 13rem section column once its frame is 60rem wide, and a sticky 56px tab strip below that which keeps the current tab in view by scrolling the strip only, including when the links are replaced or the web font swaps. Without navigation it is the 48rem column alone. Its `className` goes on the frame, so a `max-w-*` bounds the width the layout answers to.

The reading layout adds its 13rem navigation track only when it has a navigation, so an article with a header or an outline but no navigation no longer drops into that track. Every existing export is unchanged.
