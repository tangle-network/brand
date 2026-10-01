---
"@tangle-network/ui": patch
---

Preserve UI output modules so unused heavyweight exports can be removed through existing package entrypoints, retaining the legacy primitives CodeBlock export. Add packed-consumer import-boundary, compatibility, and controlled bundle-layout comparison checks.
