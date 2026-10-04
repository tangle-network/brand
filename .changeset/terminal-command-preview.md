---
"@tangle-network/ui": minor
---

`CommandPreview` renders a shell command as a terminal block: a `$ command` prompt line with its exit status, and stdout and stderr in separate regions on a dark inset that keeps its contrast in both themes. It reads the plain-string output a workflow persists as well as `{ stdout, stderr, exitCode }`, shows an exit-code badge only when a code is known, and is collapsed until opened (`defaultExpanded` opts out; the expanded tool row passes it).
