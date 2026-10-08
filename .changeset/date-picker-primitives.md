---
"@tangle-network/ui": minor
---

Add `Calendar` (a keyboard-navigable month grid), `DatePicker` (a control-scale trigger that opens it and reports `YYYY-MM-DD`, shown in the viewer's locale instead of a `mm/dd/yyyy` mask) and `TimeSelect` (a Select of `step`-minute slots reporting `HH:MM`) to replace native date and time inputs. `Button` gains `variant="bare"`: the shared focus ring and disabled behavior for rows, tiles and pills that draw their own layout. Fields read their fill from `--field-surface` (default the field well), and `Toolbar` sets it to the card surface, so filters on the page canvas render as raised controls.
