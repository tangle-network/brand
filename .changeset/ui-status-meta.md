---
"@tangle-network/ui": minor
---

`statusMeta(status)` returns the one `{ label, icon, token }` for Running, Waiting, Needs you, Done, Failed, Stopped, Idle and Unknown, and `RunStatusIcon` draws it on the 16px lucide grid at stroke 1.75. `runStatus` maps the vocabularies ui already speaks (completed, error, attention-needed, cancelled …) and reads anything else as Unknown. Failed is always CircleX; only Needs you takes the warning amber; Running breathes on `--motion-ambient` instead of spinning. `RunPhaseList`, `ExpandedToolDetail` and `RunGroup` render their status through it, so a failed phase reads "Failed" with CircleX and a finished run reads "Done" with CircleCheck.
