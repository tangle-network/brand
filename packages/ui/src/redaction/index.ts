/**
 * The client half of agent-app's reversible redaction.
 *
 * `agent-app/redact` builds a document of masked spans with each original kept
 * encrypted, and reveals one span at a time through `revealSpan`, where the
 * authorization and the audit record happen. This module renders that document
 * and calls back for a reveal.
 *
 * The two segment types are deliberately not identical: agent-app's carries the
 * `cipher` for a masked span, and this one does not. The ciphertext stays on the
 * server, so the type a browser holds cannot name it.
 */
export {
  RedactedDocument,
  type RedactedDocumentProps,
  type RedactedDocumentData,
  type RedactedDocSegment,
  type RevealResult,
} from "./redacted-document";
