---
"@tangle-network/ui": patch
---

A closed terminal command is a quiet bordered row on the surface it sits on, and turns into the dark terminal only when opened, so a list of commands no longer reads as a stack of black bars. A tool that reported an error with no exit code shows a neutral "tool error" badge; red is kept for a recorded nonzero exit. A command wraps between its tokens: a token of up to 32 characters, such as `--short`, is never split at its hyphen, and the copied text is unchanged. The status pill marks a failed state with a cross instead of a slashed disc, which read as "disabled".
