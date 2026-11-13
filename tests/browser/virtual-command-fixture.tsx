import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, VirtualCommand } from '@tangle-network/ui/primitives'
import '@tangle-network/ui/styles/command.css'

/** Actual installed command/virtualizer; the URL is the consumer's committed selection. */
export function VirtualCommandConsumer() {
  const initial = new URLSearchParams(location.search)
  const [size, setSize] = useState(Number(initial.get('choice-count')) || 122)
  const [many, setMany] = useState(false), [removed, setRemoved] = useState(''), [disabled, setDisabled] = useState('')
  const [value, setValue] = useState(initial.get('choice') ?? 'choice:0121'), [commits, setCommits] = useState(0)
  const inspector = initial.get('inspector') === 'mobile', panel = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!inspector || !commits || !matchMedia('(max-width: 720px)').matches) return
    panel.current?.focus({ preventScroll: true })
    panel.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [value, commits, inspector])
  const key = (at: number) => `choice:${String(at).padStart(4, '0')}`
  const route = (next: string, count = size) => {
    const url = new URL(location.href); url.searchParams.set('choice', next); url.searchParams.set('choice-count', String(count))
    history.replaceState(null, '', url); setValue(next)
  }
  const choices = useMemo(() => Array.from({ length: size }, (_, at) => ({
    value: key(at), label: at === 7 || at === 8 ? 'Twin label' : `Recorded choice ${String(at).padStart(4, '0')}`,
    group: many ? { value: `group:${at}`, label: `Group ${at}` } : { value: at < size / 2 ? 'A' : 'B', label: at < size / 2 ? 'Group A' : 'Group B' },
    disabled: at === 3 || key(at) === disabled, keywords: at === 3 ? ['disabled-only-zqx'] : undefined,
  })).filter(item => item.value !== removed), [size, many, removed, disabled])
  const configure = (count: number, grouped = false) => {
    setSize(count); setMany(grouped); setRemoved(''); setDisabled(''); route(key(count - 1), count)
  }
  return <section data-virtual-command-consumer style={{ margin: 16 }}>
    <h2>Recorded choices</h2>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button onClick={() => configure(122)}>Use 122 choices</Button>
      <Button onClick={() => configure(1000)}>Use 1000 choices</Button>
      <Button onClick={() => configure(1000, true)}>Use 1000 groups</Button>
      <Button onClick={() => setTimeout(() => setRemoved(value), 2000)}>Remove current after opening</Button>
      <Button onClick={() => setTimeout(() => setDisabled(value), 2000)}>Disable current after opening</Button>
    </div>
    <output aria-label="Committed choice">{value}</output>
    <output aria-label="Choice commits">{commits}</output>
    <output aria-label="Removed choice">{removed}</output>
    <output aria-label="Disabled choice">{disabled}</output>
    <VirtualCommand items={choices} value={value} onSelect={next => { setCommits(count => count + 1); route(next) }}
      label="Find recorded choice" listLabel="Recorded choices" trigger={<Button>Choose recorded item</Button>} />
    {inspector && <aside ref={panel} tabIndex={-1} aria-label="Recorded inspector">Selected record: {value}</aside>}
  </section>
}
