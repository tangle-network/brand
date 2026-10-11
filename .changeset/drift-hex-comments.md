---
"@tangle-network/brand": patch
---

tangle-drift no longer counts issue references in comments ("React error #310", "(#346)") as hex colours. hex reads whole files with comments blanked (/* */, //, <!-- -->), like header_height_literal and transcript_type_override. A Hospitality recovery release failed on such a comment.
