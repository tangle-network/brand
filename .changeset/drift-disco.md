---
"@tangle-network/brand": patch
---

`tangle-drift` scans Discovery (`--surface disco`, tangle-network/disco-app `web`) and gates three composition metrics: `primitive_control_composition` (a `DropdownMenu`, `Popover`, `Select` or `Command` import from `@tangle-network/ui/primitives`, where sandbox-ui owns the pickers), `local_mark_composition` (a `HarnessLogo` or `ModelBrandStack` placed by hand instead of sandbox-ui `SeatMark`) and `nav_row_hand_painted` (a selected row painted without `ixRow` + `ixSelected` on `aria-current`, or an action nav item made the active location). A consumer's own baseline keeps passing until it records them.
