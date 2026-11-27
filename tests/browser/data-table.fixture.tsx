import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DataTable,
  DataTableBar,
  DataTableFrame,
  DataTableMoney,
  DataTableStatus,
  type DataTableColumn,
} from "../../packages/ui/src/primitives/data-table";
// Brand's tokens and UI's presentation contract only, no Tailwind: the table must hold up in a consumer that compiles none.
import "../../packages/brand/src/styles/tokens.css";
import "../../packages/brand/src/styles/named-themes.css";
import "../../packages/ui/src/styles/presentation.css";

const theme = new URL(location.href).searchParams.get("theme") ?? "dark";
document.documentElement.setAttribute("data-theme", theme);
document.documentElement.style.colorScheme = theme;
document.body.style.cssText = "margin:0;padding:16px;background:hsl(var(--hsl-background));color:hsl(var(--foreground));font-family:system-ui,sans-serif;";

interface Run { id: string; state: string; word: string; wall: number | null; tries: number | null; best: string; usd: number | null; qualifier?: "at-least" | "estimated" }

// Worst-case rows: a long unbreakable name, every state, an unpriced and an unmeasured run, and more than twenty rows.
const STATES: [string, string][] = [["live", "live"], ["passed", "Passed"], ["failed", "Failed"], ["cancelled", "Cancelled"], ["queued", "Queued"]];
const RUNS: Run[] = Array.from({ length: 24 }, (_, i) => {
  const [state, word] = STATES[i % STATES.length]!;
  return {
    id: i === 0 ? "procedure-census-matrix-m54-team-web-20261127b-a-very-long-run-name-with-no-breaks" : `run-${String(27 - i).padStart(2, "0")}${"ab"[i % 2]}`,
    state, word,
    wall: i === 3 ? null : Number(((i * 7.3) % 9.7 + 0.1).toFixed(1)),
    tries: i % 4 === 0 ? null : (i % 9) + 1,
    best: i % 3 === 0 ? "no pass yet · reached evidence v1 rc2" : i % 3 === 1 ? "1 check, no release" : "passed contract v2 rc1 with a long qualifying note that has to wrap",
    usd: i === 2 ? null : Number((i * 1.37 + 0.42).toFixed(2)),
    qualifier: i % 5 === 1 ? "at-least" : i % 5 === 2 ? "estimated" : undefined,
  };
});
const MAX_WALL = Math.max(...RUNS.map((run) => run.wall ?? 0));

function Runs() {
  const [direction, setDirection] = useState<"asc" | "desc" | undefined>(undefined);
  const rows = direction ? [...RUNS].sort((a, b) => ((a.wall ?? -1) - (b.wall ?? -1)) * (direction === "asc" ? 1 : -1)) : RUNS;
  const columns: DataTableColumn<Run>[] = [
    { key: "run", header: "Run", primary: true, cell: (run) => <a href={`#${run.id}`}>{run.id}</a> },
    { key: "state", header: "Ending", nowrap: true, cell: (run) => <DataTableStatus status={run.state}>{run.word}</DataTableStatus> },
    { key: "wall", header: "Wall time", width: "12rem", sort: { direction, onSort: () => setDirection(direction === "desc" ? "asc" : direction === "asc" ? undefined : "desc") },
      cell: (run) => <DataTableBar value={run.wall} max={MAX_WALL}>{run.wall == null ? "—" : `${run.wall.toFixed(1)} h`}</DataTableBar> },
    { key: "tries", header: "Tries", align: "end", cell: (run) => run.tries ?? <span className="tangle-data-table-faint">—</span> },
    { key: "best", header: "Best check", cell: (run) => run.best },
    { key: "usd", header: "API-equiv.", align: "end", cell: (run) => <DataTableMoney value={run.usd} qualifier={run.qualifier} unknown="API-equivalent not priced" /> },
  ];
  return <DataTable label="Runs" title="Runs" meta="$14.59 · $14.59 per step passed" columns={columns} rows={rows} rowKey={(run) => run.id}
    rowProps={(run, index) => ({ "data-run": run.id, ...(index === 1 ? { "aria-current": "true" as const } : {}) })} />;
}

const BOARD_COLUMNS = ["Board", "Kind", "Published best", "Best rival", "Plain solver", "Disco best", "Gap", "Pressed", "Checker", "Updated"];

createRoot(document.getElementById("root")!).render(
  <main style={{ display: "grid", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
    <Runs />
    <DataTable label="Empty runs" title="Runs" meta="none yet" columns={[{ key: "run", header: "Run", primary: true, cell: () => null }, { key: "usd", header: "API-equiv.", align: "end", cell: () => null }]}
      rows={[]} rowKey={() => "none"} empty="No runs yet" />
    <DataTableFrame label="Boards" title="Boards" meta="85 boards" density="compact">
      <thead><tr>{BOARD_COLUMNS.map((name) => <th key={name} scope="col" data-align={name === "Plain solver" || name === "Disco best" || name === "Gap" ? "end" : undefined}>{name}</th>)}</tr></thead>
      <tbody>{["Circle Packing in a Square", "Barnard-Steinerberger autocorrelation constant C_1c (lower bound)", "Covering design C(17,7,3)"].map((board) => (
        <tr key={board}>{BOARD_COLUMNS.map((name, i) => <td key={name} data-primary={i === 0 || undefined} data-align={i >= 4 && i <= 6 ? "end" : undefined}>{i === 0 ? board : i === 1 ? "live" : i >= 4 && i <= 6 ? "2.635983085" : "AlphaEvolve, 2026-03-24"}</td>)}</tr>
      ))}</tbody>
    </DataTableFrame>
    <DataTableFrame label="Ledger" title="Ledger" as="grid">
      <div role="rowgroup"><div role="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}><div role="columnheader">Run</div><div role="columnheader" data-align="end">Hours</div></div></div>
      <div role="rowgroup">{["27b", "27a", "26a"].map((id) => <div key={id} role="row" data-row="" data-state={id === "27a" ? "selected" : undefined} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 12 }}><div role="cell">{id}</div><div role="cell" data-align="end">1.8</div></div>)}</div>
    </DataTableFrame>
  </main>,
);
