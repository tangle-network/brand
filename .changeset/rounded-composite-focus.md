---
"@tangle-network/brand": patch
"@tangle-network/ui": patch
---

Keep the native field fallback outline off borderless editors inside composite fields. The shared focusFieldWithin helper retains the rounded outer border and halo; standalone fields keep their own focus treatment.
