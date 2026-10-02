---
"@tangle-network/ui": minor
---

Port Sandbox's Heading and PageShell into the generic UI package. Use one
Heading renderer for page and card titles; preserve existing PageHeader inputs
and map the existing Sandbox inputs. Normalize card padding, keep hover
decorative, support explicit card title levels, and make table-wrapper
accessibility configurable with a wrapper opt-out for caller-owned scrolling.
