---
"@tangle-network/ui": minor
---

Add `<RedactedDocument>` viewer (`@tangle-network/ui/redaction`): renders a server-produced redacted document with masked, click-to-reveal spans. The client holds only `{ id, kind }` per span; revealing one round-trips through an `onReveal` callback so authorization and the audit trail stay server-side (pairs with `@tangle-network/agent-app/redact`'s `buildRedactedDocument` / `revealSpan`).
