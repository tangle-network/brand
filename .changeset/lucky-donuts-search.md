---
"@tangle-network/ui": minor
---

Publish the redaction renderer on its own `./redaction` subpath.

`RedactedDocument` is the client half of agent-app's reversible redaction: agent-app builds a document of masked spans and reveals one at a time through `revealSpan`, where authorization and the audit record happen, and this component renders that document and calls back for a reveal. It reached the package only through the root entry, and no consumer imports the bare package — every app takes ui through a subpath — so the component was unreachable in practice.

The module gains a header stating what it pairs with, including why its segment type omits the `cipher` that agent-app's carries: the ciphertext stays on the server, so the type a browser holds cannot name it.
