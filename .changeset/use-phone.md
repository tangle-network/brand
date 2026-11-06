---
"@tangle-network/ui": patch
---

Add `usePhone` and `PHONE_MEDIA` to `@tangle-network/ui/hooks`: the one phone breakpoint (767 px) a workspace switches to one region at a time on. sandbox-ui's `agent-inspector.tsx` and the Discovery viewer's `use-phone.ts` carried their own copies at 767 px and 1023 px; both move to this one.
