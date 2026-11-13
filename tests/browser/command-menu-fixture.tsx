import React, { useRef, useState } from 'react'
import { Button, Command, defaultFilter, Popover, PopoverContent, PopoverTrigger } from '@tangle-network/ui/primitives'
import { Command as UpstreamCommand, defaultFilter as upstreamFilter } from 'cmdk'
import { RunStatusIcon } from '@tangle-network/ui/run'
import { useRunNow, useSSEStream } from '@tangle-network/ui/hooks'
import '@tangle-network/ui/styles/command.css'

const groups = ['Workers', 'Reviewers'].map((heading, group) => ({ heading, items: Array.from({ length: 500 }, (_, i) => ({
  id: `${group ? 'beta' : 'alpha'}:${String(i).padStart(4, '0')}`,
  name: !group && i < 2 ? 'Duplicate choice' : `${group ? 'Reviewer' : 'Worker'} ${String(i).padStart(4, '0')}`,
})) }))

export function CommandMenuFixture() {
  const [open, setOpen] = useState(false), [selected, select] = useState('alpha:0000'), [commits, commit] = useState(0)
  const now = useRunNow(), stream = useSSEStream({ url: '/buffer?backend=command' })
  const root = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null)
  Object.assign(window, { commandRefs: () => ({ root: root.current?.hasAttribute('cmdk-root'), input: input.current?.hasAttribute('cmdk-input') }) })
  return <>
    <RunStatusIcon status="running" data-proof-status="" />Running
    <output data-status-clock="">{now}</output><output data-status-stream="">{stream.events.at(-1)?.data.value ?? 0}</output>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button aria-label="Choose recorded item">Choose item</Button></PopoverTrigger>
      <PopoverContent align="start" className="p-0"><Command label="Find recorded item" defaultValue={selected} ref={root}>
        <Command.Input ref={input} aria-label="Find recorded item" placeholder="Find a recorded item…" />
        <Command.List label="Recorded choices"><div data-command-group-heading="">Recorded choices</div><Command.Empty><span role="status">No choices found.</span></Command.Empty>
          {groups.map(group => <Command.Group key={group.heading} heading={group.heading}>{group.items.map(item => <Command.Item key={item.id} value={item.id} keywords={[item.name]}
            onSelect={value => { select(value); commit(n => n + 1); setOpen(false) }}>{item.name}</Command.Item>)}</Command.Group>)}
        </Command.List>
      </Command></PopoverContent>
    </Popover>
    <output data-command-identity="">{String(Command === UpstreamCommand && Command.Input === UpstreamCommand.Input && Command.Item === UpstreamCommand.Item && defaultFilter === upstreamFilter)}</output>
    <output data-command-selected="">{selected}</output>
    <output data-command-commits="">{commits}</output>
  </>
}
