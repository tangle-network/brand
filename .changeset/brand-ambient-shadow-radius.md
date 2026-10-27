---
"@tangle-network/brand": minor
---

One loop period, one shadow colour and one radius ramp.

- `--duration-ambient` (2000ms) and `--motion-ambient` (ease-in-out) are the only loop period on a page; the shared `tangle-breathe` keyframe breathes a running mark on them, opacity only. Reduced motion keeps that period, so the essential "still working" signal survives.
- `--shadow-color` is the one shadow colour, as HSL channels: black in dark, `220 40% 8%` in light. Every spine shadow, the agents and hospitality themes and system.css draw in it; hospitality's forest-tinted shadow becomes the light shadow colour. The dark `--shadow-overlay` no longer inverts into a white halo.
- Radius roles are one ramp: `--radius-tag` 4, `--radius-control` 8, `--radius-card` 12, `--radius-container` 16, `--radius-pill`. `--radius-chip`, `--radius-field` and `--radius-panel` keep their values as aliases of control, card and container.
