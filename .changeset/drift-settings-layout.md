---
"@tangle-network/brand": minor
---

`tangle-drift` gates `settings_layout`: settings page files (route or page modules whose path names settings, or files named for their settings, such as `BusinessSettings.tsx` or `SettingsTab.tsx`) that import nothing from `@tangle-network/agent-app/settings-react` and sit under no settings layout that does. Only a layout covers its children (a Next.js `layout`, a flat route parent or a `route.tsx` folder route); a composing `page` or `index` covers only itself. Cards, sections, dialogs, hooks, menus and buttons are not pages. The shipped baseline records each surface's count from its default branch, so new local settings pages fail a consumer's gate and the count only falls as apps adopt the shared settings layout.
