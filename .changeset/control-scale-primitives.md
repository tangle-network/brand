---
"@tangle-network/ui": minor
---

Put `Button`, `Input`, `Textarea` and `SelectTrigger` on one control scale: `sm` 32px/12px text, `md` (default) 36px/14px, `lg` 44px/16px, read from Brand's control tokens with pixel fallbacks. Visible changes: a default `Input` is now 36px (was 44px) with 12px side padding (was 16px), matching the default `Button` and `SelectTrigger`; `Input` `sm` is 32px (was 36px) and `lg` 44px (was 48px); `SelectTrigger` uses the `rounded-lg` corner at md and gains `sm|md|lg`; `Button` `lg` text is 16px (was 14px); fields render 16px text on a coarse pointer so iOS does not zoom on focus. `Button` adds `md`, `icon-sm` (32px) and `icon-lg` (44px). New `HelpText` (`tone="hint" | "error"`, 12px) renders `Input` and `Textarea` hints and errors (were 14px); `Label` reads `--font-size-label`. `compact`, `touch` and `xl` are unchanged.
