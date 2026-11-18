---
"@tangle-network/ui": minor
---

Marketing: `HarnessStrip` becomes a selectable grid when its harnesses carry `capture` or `launchHref`, opening a panel with the harness's recorded terminal session, its provenance and one "Run it live" link; plain `hrefTemplate` link tiles keep working. New `TerminalReplay` plays an asciinema v2 recording in xterm.js (optional peer `@xterm/xterm`, loaded on first use) with play, pause, seek, input markers and compressed idle time. New `CliPlayground` replays recorded output for a short list of `tangle` commands beside a sign-in link. New `UseCaseCards` replays recorded runs as short stories that end in a template link.
