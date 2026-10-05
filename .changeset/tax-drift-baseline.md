---
"@tangle-network/brand": patch
---

Lower the Tax drift baseline to its measured main (tangle-network/tax-agent ff4b703): raw palette 133 to 0, hex 8 to 0, arbitrary colors 7 to 0, redeclared tokens 8 to 0. Tax runs `tangle-drift check --surface tax` in its sign-off, so any new palette class, hex value or token copy now fails its gate.
