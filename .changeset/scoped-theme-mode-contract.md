---
"@tangle-network/brand": minor
"@tangle-network/ui": patch
---

Keep Brand dark-default while exporting a checked, generated light-default compatibility stylesheet. Re-resolve shared aliases and syntax colors at nested mode boundaries, retain named identities, and make ThemeToggle SSR-, storage- and system-change-safe. CodeBlock now uses scoped semantic CSS variables with immediate browser recoloring.
