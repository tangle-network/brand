---
"@tangle-network/brand": patch
"@tangle-network/ui": patch
---

tangle-drift ignores CSS comments when counting header_height_literal and transcript_type_override, and no longer counts a step-progress bar (`.steps-bar`) as a header row. UI's RunGroup sets its Markdown with the shared TRANSCRIPT_TEXT instead of a fixed 15px / leading-7, so a run reads at the transcript scale.
