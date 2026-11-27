---
"@tangle-network/ui": patch
---

Add the data table: `DataTable` (columns and rows) and `DataTableFrame` (native table markup) on a card surface, with
`DataTableStatus`, `DataTableBar`, `DataTableMoney` and `DataTableEmpty` cells, density, right-aligned tabular numbers,
row hover and selection, and rows that stack into label and value pairs under 40rem of their own width. Its values live
in `styles/presentation.css` and its class names in `dataTablePresentation`, so a consumer without Tailwind renders the
same table. `runStatus` now reads `live`, `passed`, `pass`, `solved` and `fail`.
