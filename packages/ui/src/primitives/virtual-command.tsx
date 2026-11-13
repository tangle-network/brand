import { useId, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { Command, defaultFilter } from 'cmdk'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { collectionTarget, VirtualList } from './virtual-list'

export type VirtualCommandItem = {
  /** Unique, nonempty and already trimmed; labels may repeat. */
  value: string
  label: string
  keywords?: readonly string[]
  group?: { value: string; label: string }
  disabled?: boolean
  content?: ReactNode
}
export type VirtualCommandProps = {
  items: readonly VirtualCommandItem[]
  value?: string
  onSelect: (value: string) => void
  label: string
  listLabel: string
  trigger: ReactElement
}
type Row = { key: string; group: string; heading?: string; item?: VirtualCommandItem; position?: number }
type Bucket = { label?: string; score: number; items: { item: VirtualCommandItem; score: number }[] }
const keyOf = (row: Row) => row.key
// cmdk's List asChild resolves a component child; a raw host string throws in its child resolver.
const ListElement = (props: ComponentPropsWithoutRef<'div'>) => <div {...props} />

/** Score the full collection once; cmdk only registers the virtual window. */
function project(items: readonly VirtualCommandItem[], query: string) {
  const buckets = new Map<string, Bucket>()
  const values = new Set<string>()
  for (const item of items) {
    if (!item.value || item.value.trim() !== item.value || values.has(item.value)) throw new Error('VirtualCommand requires unique, nonempty, trimmed values')
    values.add(item.value)
    const score = query ? defaultFilter(item.value, query, [item.label, ...(item.keywords ?? [])]) : 1
    if (!score) continue
    const group = item.group?.value ?? ''
    const bucket: Bucket = buckets.get(group) ?? { label: item.group?.label, score: 0, items: [] }
    bucket.score = Math.max(bucket.score, score)
    bucket.items.push({ item, score })
    buckets.set(group, bucket)
  }
  const groups = [...buckets.entries()]
  if (query) groups.sort(([a, x], [b, y]) => !a ? -1 : !b ? 1 : y.score - x.score)
  const options: VirtualCommandItem[] = [], rows: Row[] = []
  for (const [group, bucket] of groups) {
    if (query) bucket.items.sort((a, b) => b.score - a.score)
    if (bucket.label !== undefined) rows.push({ key: `heading:${group}`, group, heading: bucket.label })
    for (const { item } of bucket.items) {
      options.push(item)
      rows.push({ key: `item:${item.value}`, group, item, position: options.length })
    }
  }
  return { rows, options, enabled: options.filter(item => !item.disabled), buckets }
}

function moveTarget(items: readonly VirtualCommandItem[], current: string | undefined, event: KeyboardEvent) {
  const down = event.key === 'ArrowDown' || event.ctrlKey && ['n', 'j'].includes(event.key)
  const up = event.key === 'ArrowUp' || event.ctrlKey && ['p', 'k'].includes(event.key)
  if (!down && !up && event.key !== 'Home' && event.key !== 'End') return
  const move = event.key === 'Home' || up && event.metaKey ? 'first' : event.key === 'End' || down && event.metaKey ? 'last' : down ? 1 : -1
  if (event.altKey && typeof move === 'number') {
    const group = items.find(item => item.value === current)?.group?.value
    const heads = items.filter((item, at) => item.group && item.group.value !== items[at - 1]?.group?.value)
    const next = group && collectionTarget(heads, item => item.group!.value, group, move)
    if (next && next !== group) return heads.find(item => item.group!.value === next)?.value
  }
  return collectionTarget(items, item => item.value, current, move)
}

function useCommandCollection({ items, value, onSelect }: VirtualCommandProps) {
  const [open, setOpen] = useState(false)
  const [instance, setInstance] = useState(0)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState<string>()
  const [request, setRequest] = useState(0)
  const scroller = useRef<HTMLDivElement | null>(null)
  const collection = useMemo(() => project(items, query), [items, query])
  const active = collection.enabled.some(item => item.value === highlight) ? highlight : collection.enabled[0]?.value
  const changeOpen = (next: boolean) => {
    if (next) { setInstance(previous => previous + 1); setQuery(''); setHighlight(value) }
    setOpen(next)
  }
  const changeQuery = (next: string) => {
    setRequest(previous => previous + 1)
    setQuery(next)
    setHighlight(undefined)
  }
  const changeHighlight = (next: string) => { if (collection.enabled.some(item => item.value === next)) setHighlight(next) }
  const select = (next: string) => {
    if (!collection.enabled.some(item => item.value === next)) return
    onSelect(next)
    setOpen(false)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return
    // Movement uses logical items; cmdk retains Enter and pointer activation.
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.ctrlKey && ['n', 'j', 'p', 'k'].includes(event.key)) {
      event.preventDefault()
      setRequest(previous => previous + 1)
      setHighlight(previous => moveTarget(collection.enabled, collection.enabled.some(item => item.value === previous) ? previous : active, event))
    }
  }
  return { open, instance, query, active, request, scroller, collection, changeOpen, changeQuery, changeHighlight, select, onKeyDown }
}

/** Reset cmdk search on opening; keep trigger toggles inside the nonmodal popup's focus ownership across reversed exits. */
export function VirtualCommand(props: VirtualCommandProps) {
  const state = useCommandCollection(props)
  const trigger = useRef<HTMLButtonElement>(null)
  const prefix = useId()
  const optionId = (value: string) => `${prefix}-${encodeURIComponent(value)}`
  const activeId = state.active === undefined ? undefined : optionId(state.active)
  const groups = {
    keyOf: (row: Row) => row.group,
    render: (key: string, children: ReactNode) => key ? <div role="group" aria-label={state.collection.buckets.get(key)?.label}>{children}</div> : children,
  }
  const render = (row: Row) => row.item ? (
    <Command.Item asChild value={row.item.value} disabled={row.item.disabled} onSelect={state.select}>
      <div id={optionId(row.item.value)} aria-posinset={row.position} aria-setsize={state.collection.options.length} data-command-value={row.item.value}>
        {row.item.content ?? row.item.label}
      </div>
    </Command.Item>
  ) : <div data-command-group-heading="">{row.heading}</div>
  return <Popover open={state.open} onOpenChange={state.changeOpen}>
    <PopoverTrigger asChild ref={trigger}>{props.trigger}</PopoverTrigger>
    <PopoverContent align="start" className="w-[min(24rem,calc(100vw-24px))] p-0"
      onInteractOutside={event => {
        if (event.target instanceof Node && trigger.current?.contains(event.target)) event.preventDefault()
      }}>
      <Command key={state.instance} label={props.label} value={state.active ?? ''} onValueChange={state.changeHighlight}
        shouldFilter={false} filter={() => 1} vimBindings={false} onKeyDown={state.onKeyDown}>
        <Command.Input asChild value={state.query} onValueChange={state.changeQuery} placeholder={props.label}>
          <input autoFocus aria-activedescendant={activeId} />
        </Command.Input>
        <Command.List asChild label={props.listLabel} ref={state.scroller}>
          <ListElement aria-activedescendant={activeId}>
            {!state.collection.options.length && <Command.Empty><span role="status">No results.</span></Command.Empty>}
            <VirtualList items={state.collection.rows} keyOf={keyOf} render={render} scroller={state.scroller} estimate={40} overscan={160}
              target={state.active === undefined ? undefined : `item:${state.active}`} targetRevision={state.request} targetAlign="nearest"
              keepMounted={state.active === undefined ? undefined : `item:${state.active}`} groups={groups} />
          </ListElement>
        </Command.List>
      </Command>
    </PopoverContent>
  </Popover>
}
