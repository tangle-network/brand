---
"@tangle-network/brand": patch
"@tangle-network/ui": minor
"@tangle-network/charts": patch
---

Update every dependency to its latest release and build with tsdown on TypeScript 7.
`@tangle-network/ui` now accepts `@nanostores/react` 2 as a peer, moves to lucide-react 1 and marked 18, and drops the unused `react-pdf` and `@radix-ui/react-toast` dependencies.
Export paths are unchanged; internal chunk file names differ.
