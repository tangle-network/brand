import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { EmptyState } from "./empty-state";
import { Input } from "./input";
import { Metric, MetricStrip } from "./metric-strip";
import { PageHeader } from "./page-header";
import { PageShell } from "./page-shell";
import { StatusPill } from "./status-pill";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Toolbar } from "./toolbar";

type PageState = "empty" | "loading" | "error" | "populated";
const items = [{ name: "Documentation build", status: "Complete" }, { name: "Package validation", status: "Complete" }];

/** Local example data and real state transitions; no auth, routing or fetching in PageShell. */
function ActivityPage({ state, fluid = false }: { state: PageState; fluid?: boolean }) {
  const titleId = useId();
  const searchId = useId();
  const [recovered, setRecovered] = useState(false);
  const [query, setQuery] = useState("");
  const current = recovered ? "populated" : state;
  const available = current === "populated" ? items : [];
  const matching = available.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const known = current === "empty" || current === "populated";
  const recover = () => { setQuery(""); setRecovered(true); };

  return <main>
    <PageShell className={fluid ? "mx-0 max-w-none" : undefined}>
      <PageHeader
        title="Workspace activity"
        eyebrow="Example workspace"
        description="Search the example activity or add example items. State is owned by this story, not the layout."
        actions={<Button type="button" disabled={current === "loading"} onClick={recover}>Add example items</Button>}
        meta={known ? <span>{matching.length} matching of {available.length} available items</span> : <span>Activity is not available yet</span>}
      />
      <MetricStrip>
        <Metric label="Available" value={known ? available.length : "—"} />
        <Metric label="Matching" value={known ? matching.length : "—"} />
        <Metric label="Completed" value={known ? available.length : "—"} />
        <Metric label="Failed" value={known ? 0 : "—"} />
      </MetricStrip>
      <section aria-labelledby={titleId}>
        <Toolbar search={<Input id={searchId} label="Search activity" value={query} disabled={!known} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" />} />
        <Card>
          <CardHeader>
            <CardTitle as="h2" id={titleId}>Activity items</CardTitle>
          </CardHeader>
          <CardContent aria-busy={current === "loading"}>
            {current === "loading" ? <p role="status">Loading activity…</p> :
              current === "error" ? <div className="space-y-3">
                <p role="alert">Activity could not be loaded. The last request failed; retry to restore the example results.</p>
                <Button type="button" onClick={recover}>Retry</Button>
              </div> : matching.length === 0 ?
                <EmptyState
                  title={query ? "No matching activity" : "No activity yet"}
                  description={query ? "Try a different search or clear the current filter." : "Add example items to see the populated table."}
                  action={<Button type="button" onClick={query ? () => setQuery("") : recover}>{query ? "Clear search" : "Add example items"}</Button>}
                /> :
                <Table wrapper={false}>
                  <TableCaption>Matching workspace activity</TableCaption>
                  <TableHeader><TableRow><TableHead scope="col">Item</TableHead><TableHead scope="col">State</TableHead></TableRow></TableHeader>
                  <TableBody>{matching.map((item) => <TableRow key={item.name}>
                    <TableHead scope="row" className="[overflow-wrap:anywhere]">{item.name}</TableHead>
                    <TableCell><StatusPill tone="success">{item.status}</StatusPill></TableCell>
                  </TableRow>)}</TableBody>
                </Table>}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">{known ? "Example data. Use search to exercise the filtered empty state." : "Missing data is not reported as zero activity."}</CardFooter>
        </Card>
      </section>
    </PageShell>
  </main>;
}

const meta = {
  title: "Primitives/PageShell",
  component: PageShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageShell>;
export default meta;
type Story = StoryObj<typeof PageShell>;

export const Populated: Story = { render: () => <ActivityPage state="populated" /> };
export const Empty: Story = { render: () => <ActivityPage state="empty" /> };
export const Loading: Story = { render: () => <ActivityPage state="loading" /> };
export const Error: Story = { render: () => <ActivityPage state="error" /> };
export const FluidWidth: Story = { render: () => <ActivityPage state="populated" fluid /> };
