---
"@tangle-network/ui": patch
---

A closed terminal command is a quiet bordered row on the surface it sits on, and turns into the dark terminal only when opened, so a list of commands no longer reads as a stack of black bars. Red is kept for evidence the command failed: a nonzero exit, a timeout or a signal. A tool that reported an error with nothing recorded about the command shows a neutral "tool error" badge. A command wraps between its tokens, so `--short` is no longer split at its hyphen; a token wider than the line still breaks, and the copied text is unchanged. The status pill marks a failed state with a cross instead of a slashed disc, which read as "disabled".
