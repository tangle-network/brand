import type { Meta, StoryObj } from '@storybook/react'
import { DataTable, DataTableBar, DataTableMoney, DataTableStatus, type DataTableColumn } from './data-table'

const meta: Meta = { title: 'Primitives/DataTable', parameters: { layout: 'padded' } }
export default meta
type Story = StoryObj

interface Run { id: string; state: string; word: string; wall: number | null; tries: number | null; best: string; usd: number | null; qualifier?: 'at-least' | 'estimated' }
const runs: Run[] = [
  { id: '27b', state: 'live', word: 'live', wall: 1.8, tries: null, best: 'no pass yet · reached evidence v1 rc2', usd: 5.88 },
  { id: '27a', state: 'failed', word: 'Failed', wall: 9.7, tries: 7, best: 'no pass yet · reached registry v1 rc2', usd: 5.89, qualifier: 'at-least' },
  { id: '26b', state: 'queued', word: 'Queued', wall: null, tries: null, best: 'not started', usd: null },
  { id: '26a', state: 'cancelled', word: 'Cancelled', wall: 0, tries: null, best: '1 check, no release', usd: null },
  { id: '25a', state: 'passed', word: 'Passed', wall: 2.6, tries: 3, best: 'passed contract v2 rc1', usd: 2.82, qualifier: 'estimated' },
]
const max = Math.max(...runs.map((run) => run.wall ?? 0))
const columns: DataTableColumn<Run>[] = [
  { key: 'run', header: 'Run', primary: true, cell: (run) => <a href={`#${run.id}`}>{run.id}</a> },
  { key: 'state', header: 'Ending', nowrap: true, cell: (run) => <DataTableStatus status={run.state}>{run.word}</DataTableStatus> },
  { key: 'wall', header: 'Wall time', width: '12rem', cell: (run) => <DataTableBar value={run.wall} max={max}>{run.wall == null ? '—' : `${run.wall.toFixed(1)} h`}</DataTableBar> },
  { key: 'tries', header: 'Tries', align: 'end', cell: (run) => run.tries ?? '—' },
  { key: 'best', header: 'Best check', cell: (run) => run.best },
  { key: 'usd', header: 'API-equiv.', align: 'end', cell: (run) => <DataTableMoney value={run.usd} qualifier={run.qualifier} /> },
]

export const Runs: Story = { render: () => <DataTable label="Runs" title="Runs" meta="$14.59 · $14.59 per step passed" columns={columns} rows={runs} rowKey={(run) => run.id} /> }
export const Compact: Story = { render: () => <DataTable label="Runs" density="compact" columns={columns} rows={runs} rowKey={(run) => run.id} /> }
export const Empty: Story = { render: () => <DataTable label="Runs" title="Runs" columns={columns} rows={[]} rowKey={(run) => run.id} empty="No runs yet" /> }
