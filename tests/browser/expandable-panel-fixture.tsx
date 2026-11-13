import React, { useState } from 'react'
import { ExpandablePanel } from '@tangle-network/ui/primitives'
import { TraceWorkspace } from '@tangle-network/sandbox-ui/run'
import '@tangle-network/charts/react/flow-waterfall.css'

const trace = {
  totalMs: 1000,
  spans: Array.from({ length: 40 }, (_, i) => ({
    id: i ? `agent-${i}` : 'root', kind: 'pipeline', name: i ? `Recorded agent ${i}` : 'Recorded root',
    startMs: i, endMs: 1000, status: 'done', facts: [{ label: 'Recorded stage', value: 'verified' }],
  })),
}

/** The public panel and actual docked/phone workspace, installed together in a fresh consumer. */
export function Panels() {
  const [selected, select] = useState<string | undefined>('root')
  return <>
    <ExpandablePanel label="Recorded timeline" className="panel-fixture"
      actions={<><input aria-label="Retained note" defaultValue="Original note" style={{ width: 100 }} /><button onClick={() => select('root')}>Reopen conversation</button></>}>
      <TraceWorkspace trace={trace} live={false} label="Recorded timeline" docked
        selectedAgentId={selected} onSelectAgent={select} streamUrl={() => '/panel-stream'} />
    </ExpandablePanel>
  </>
}
