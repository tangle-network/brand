---
"@tangle-network/ui": patch
---

`CommandPreview` prints a failed command's text once when the producer persisted it as both the output and the error.

It also reads a JSON string as a `{ stdout, stderr, exitCode }` envelope only when every key is an envelope key, so a command whose own output is JSON with a `stdout` field is shown as printed, and an `error` status turns the exit badge red even when the retained exit code is 0.
