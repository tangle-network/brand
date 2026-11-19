import { AgentTimeline, type AgentTimelineItem } from '../chat/agent-timeline';
import { CodeBlock, CopyButton } from '../markdown/code-block';
import { InlineThinkingItem } from '../run/inline-thinking-item';
import { Button } from '../primitives/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../primitives/dropdown-menu';
import { Fragment, useId, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Play, Pause } from 'lucide-react';
import { ExampleReceipt, RecordedOutput } from './example-result';
import { useReplay, seconds, usd, callValue, returnRows, type Ev, type Mark, type RunMeta } from './run-replay';

// The example editor from tangle.tools: a list of example files, each file's source, and the recorded production run
// beside it. It takes its examples as props and imports no data; style it with @tangle-network/ui/styles/marketing.css.
export interface Idea {
  id: string;
  title: string;
  code: string;
  run?: RunMeta;
  install?: string;
  view?: "timeline" | "page" | "scoreboard" | "states" | "tree" | "spend" | "egress";
  /** Present stdout from this recorded call first. Column labels describe a JSON array of rows. */
  output?: { call: string; title: string; columns?: string[] };
  figure?: string;
  lead?: string;
  stopped?: string;
  resumed?: string;
  /** The recorded message to keep beside the first tool result. */
  timelineNoteAt?: number;
}
export interface Subject { id: string; label: string; install: string; ideas: Idea[] }
const PLAY_MS: [number, number] = [5000, 20_000]; // every replay lasts this long: a short record plays slower, a long one faster
const IDLE: [number, number] = [2500, 1200]; // a wait over 2.5 s plays in 1.2 s, long enough to see the agent think
const marks = (events: Ev[]): Mark[] => events.flatMap((event) => [{ atMs: event.atMs }, { atMs: event.atMs + (event.durationMs ?? 0) }]);
const short = (text: string, max = 24) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** What a call returned, in the few characters that fit beside its line. */
function brief(result: any): string {
  if (result == null || result === 'stream') return '';
  if (typeof result === 'number') return String(+result.toFixed(4));
  if (typeof result === 'string') return short(result.trim().split('\n')[0]);
  if (Array.isArray(result)) return `${result.length} ${result.length === 1 ? 'result' : 'results'}`;
  if (typeof result.spentUsd === 'number') return typeof result.capUsd === 'number' ? `${usd(result.spentUsd)} of ${usd(result.capUsd)}` : usd(result.spentUsd);
  if (typeof result.exitCode === 'number') return `exit ${result.exitCode}`;
  if (typeof result.composite === 'number') return `score ${result.composite}`;
  const value = result.url ?? result.id ?? result.fleetId ?? result.snapshotId?.slice(0, 12) ?? result.jobId ?? result.path ?? result.outcome ?? result.status ?? result.state;
  return typeof value === 'string' ? short(value.replace(/^https:\/\//, '')) : '';
}
const failed = (event: Ev) => !!event.error || (typeof event.result?.exitCode === 'number' && event.result.exitCode !== 0);

type Item = AgentTimelineItem & { atMs: number };
const tidy = (input: Record<string, unknown> = {}) => Object.fromEntries(Object.entries(input).map(([k, v]) => [k, typeof v === 'string' ? v.replace(/\/home\/agent\//g, '') : v]));

function textResult(text: string, label: string, compact: boolean) {
  const content = text.trimEnd();
  const structured = compact && /^(?:diff --git |TAP version )/m.test(content);
  return <details className="qs-event-output"><summary>{label}</summary><pre data-theme={structured ? 'light' : undefined}>{structured ? content.split(/(?<=\n)/).map((line, i) => {
    const ink = /^(?:\+(?!\+\+)|ok \d+\b|# pass \d+|# fail 0\b)/.test(line) ? 'add'
      : /^(?:-(?!--)|not ok \d+\b|# fail [1-9])/.test(line) ? 'remove' : line.startsWith('@@') ? 'hunk' : undefined;
    return <span key={i} data-result-ink={ink}>{line}</span>;
  }) : content}</pre></details>;
}

/** Only a completed SDK call owns a result. Attach it to the same recorded clock as its source line. */
function callOutput(event: Ev, idea: Idea, compact: boolean) {
  if (idea.output?.call === event.label && idea.output) return <RecordedOutput output={idea.output} calls={[event]} hasRecordedCall />;
  const stdout = event.result?.stdout, stderr = event.error?.message ?? event.result?.stderr;
  if (stderr && !stdout) return textResult(String(stderr), failed(event) ? 'Recorded error' : 'Standard error', compact);
  if (typeof stdout === 'string' && stdout.trim()) {
    const passes = stdout.match(/^# pass (\d+)/m)?.[1], failures = stdout.match(/^# fail (\d+)/m)?.[1];
    if (!stdout.trim().includes('\n') && stdout.trim().length <= 150) {
      return <pre className="qs-inline-output" aria-label="Standard output">{stdout.trimEnd()}</pre>;
    }
    return textResult(stdout, passes ? `${passes} tests passed${failures && failures !== '0' ? `, ${failures} failed` : ''}` : stdout.startsWith('diff --git ') ? 'View recorded patch' : 'Standard output', compact);
  }
  if (event.name === 'fetch' && typeof event.result?.body === 'string') return textResult(event.result.body, `Response body · HTTP ${event.result.status}`, compact);
  if (event.result?.aggregates?.byScenario) return <dl className="qs-event-scores" aria-label="Recorded scenario scores">
    {Object.entries(event.result.aggregates.byScenario).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{String((value as {meanComposite: number}).meanComposite)}</dd></div>)}
  </dl>;
}

/** One chronological transcript for every run. A streamed tool keeps its row while its state changes. */
function activity(events: Ev[], t: number, source: string[], idea: Idea, compact: boolean) {
  const items = new Map<string, Item>();
  const externalFiles = idea.code.includes('.download(');
  const streamed = events.some(event => event.data?.part?.type === 'text');
  const printed = new Set<string>();
  let active: Ev | undefined, latest: Ev | undefined, busy = false;
  for (const [index, event] of events.entries()) {
    if (event.atMs > t) break;
    const id = 'event-' + index, atMs = event.atMs;
    const part = event.type === 'message.part.updated' ? event.data?.part : undefined;
    if (event.kind === 'call') {
      const doneAt = atMs + (event.durationMs ?? 0), done = doneAt <= t;
      if (event.line) { latest = event; if (!done) active = event; }
      const line = source[(event.line ?? 0) - 1] ?? '';
      const command = event.name === 'exec' && line.match(/\.exec\(\s*(["'`])(.+?)\1/)?.[2];
      const label = command || event.label || event.name || 'SDK call';
      if (done && typeof event.result?.stdout === 'string') printed.add(event.result.stdout.trim());
      const result = done ? callValue(event, source) || brief(event.result) : '';
      items.set(id, { id, atMs, kind: 'tool', call: { id, type: command ? 'bash' : 'unknown', label, status: !done ? 'running' : failed(event) ? 'error' : 'success',
        detail: [event.line ? `Line ${event.line}` : '', !compact && typeof result === 'string' ? result : '', !compact && done && event.durationMs ? seconds(event.durationMs) : ''].filter(Boolean).join(' · ') } });
      if (event.name === 'prompt') {
        busy ||= !done;
        const prompt = source[(event.line ?? 0)-1]?.match(/\.prompt\(\s*(["'`])(.+)\1/)?.[2];
        if (prompt) items.set(id+'-prompt', { id: id+'-prompt', atMs, kind: 'message', role: 'user', content: prompt, collapsedLines: 3 });
        if (done && !streamed && !externalFiles && typeof event.result?.response === 'string') items.set(id+'-reply', { id: id+'-reply', atMs: doneAt, kind: 'message', role: 'assistant', content: event.result.response });
      }
      const output = done && callOutput(event, idea, compact);
      if (output) items.set(id+'-result', { id: id+'-result', atMs: doneAt, kind: 'custom', content: output });
    } else if (part?.type === 'tool') {
      const status = part.state?.status === 'completed' ? 'success' : part.state?.status === 'error' ? 'error' : 'running';
      // External page data is never transcript copy. Report recorded tool status and the network refusal.
      const refusal = externalFiles && String(part.state?.output ?? '').match(/"code":"(EGRESS_DOMAIN_NOT_ALLOWED)"/)?.[1];
      const shell = compact && !externalFiles && /^(bash|shell)$/i.test(part.tool) && typeof part.state?.input?.command === 'string'
        ? part.state.input.command : '';
      items.set(part.id, { id: part.id, atMs: items.get(part.id)?.atMs ?? atMs, kind: 'tool',
        call: { id: part.id, type: shell ? 'bash' : 'unknown', label: shell || refusal || part.tool, detail: shell ? '' : undefined, status },
        part: externalFiles ? undefined : { ...part, state: { ...part.state, input: shell ? part.state.input : tidy(part.state?.input) } } });
    } else if (part?.type === 'text' || part?.type === 'reasoning') {
      if (externalFiles && atMs !== idea.timelineNoteAt) continue;
      const end = (event as { endMs?: number }).endMs ?? atMs, live = t < end;
      const text = live ? part.text.slice(0, Math.ceil(part.text.length * (t - atMs) / (end - atMs))) : part.text;
      items.set(part.id, part.type === 'text' ? { id: part.id, atMs, kind: 'message', role: 'assistant', content: text, isStreaming: live }
        : { id: part.id, atMs, kind: 'custom', content: <InlineThinkingItem part={{ type: 'reasoning', text, time: { start: atMs, end: live ? undefined : end } }} /> });
    } else if ((event.kind === 'stdout' || event.kind === 'stderr') && !externalFiles && !idea.output && event.text?.trim() && !printed.has(event.text.trim()) && !/\b(?:inputTokens|cacheReadTokens)\b/.test(event.text)) {
      items.set(id, { id, atMs, kind: 'custom', content: textResult(event.text, event.kind === 'stderr' ? 'Standard error' : 'Console output', compact) });
    } else if (event.type === 'agent.started') items.set(event.data.agentId, { id: event.data.agentId, atMs, kind: 'tool', call: { id: event.data.agentId, type: 'unknown', label: event.data.agentId, detail: event.data.harness, status: 'running' } });
    else if (event.type === 'agent.finished') { const item = items.get(event.data.result?.agentId); if (item?.kind === 'tool') item.call = { ...item.call, status: event.data.result.status === 'completed' ? 'success' : 'error' }; }
  }
  const list = [...items.values()].sort((a,b) => a.atMs-b.atMs);
  const quiet = !list.some(item => item.kind === 'tool' && item.call.status === 'running' || item.kind === 'message' && item.isStreaming);
  return { items: list, active: active ?? latest, thinking: busy && quiet };
}

/** Return rows reserve space below the highlighted statement instead of covering source. */
function useReturns(pane: React.RefObject<HTMLElement | null>, rows: ReturnType<typeof returnRows>, code: string) {
  const [tops, setTops] = useState<Map<number, number>>(new Map());
  useLayoutEffect(() => {
    const el = pane.current, pre = el?.querySelector('pre');
    if (!el || !pre) return;
    const measure = () => {
      const base = el.getBoundingClientRect().top - el.scrollTop;
      const lines = [...el.querySelectorAll<HTMLElement>('pre > code > span')];
      setTops(new Map([...rows.keys()].flatMap(i => lines[i] ? [[i, lines[i].getBoundingClientRect().bottom - base - parseFloat(getComputedStyle(lines[i]).paddingBottom)]] : [])));
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(pre);
    return () => observer.disconnect();
  }, [rows, code]);
  return tops;
}

function Workspace({ idea, folder, showReceipt, playOnSelect, picker }: { idea: Idea; folder: string; showReceipt: boolean; playOnSelect: boolean; picker?: ReactNode }) {
  const compact = Boolean(picker);
  const source = useRef<HTMLElement>(null);
  const band = useRef<HTMLElement>(null), follow = useRef(true);
  const feed = useRef<HTMLDivElement>(null), followFeed = useRef(true);
  const returnsId = useId();
  const replay = useReplay(idea.run?.url ?? '', marks, IDLE, PLAY_MS, idea.run?.events, { startAt: 'beginning', autoplay: playOnSelect });
  const { events, line, r } = replay;
  const t = replay.started ? replay.t : -1;
  const ended = replay.started && !!line && r >= line.total;
  const code = useMemo(() => idea.code.trimEnd().split('\n'), [idea.code]);
  const rows = useMemo(() => returnRows(events ?? [], t, code, idea.run?.costUsd), [events, t, code, idea.run?.costUsd]);
  const tops = useReturns(source, rows, idea.code);
  const run = useMemo(() => activity(events ?? [], t, code, idea, compact), [events, t, code, idea, compact]);
  const preview = useMemo(() => {
    const first = events?.find(event => event.kind === 'call');
    if (!first) return [];
    return activity([first], first.atMs + (first.durationMs ?? 0), code, idea, compact).items;
  }, [events, code, idea, compact]);
  const current = ended ? undefined : run.active;
  const activeLine = current?.line;
  useLayoutEffect(() => {
    if (!activeLine) return;
    const pane = source.current, marker = band.current;
    const row = pane?.querySelector<HTMLElement>(`pre > code > span:nth-child(${activeLine})`);
    if (!pane || !row || !marker) return;
    row.dataset.executing = 'true';
    const place = () => {
      const bounds = pane.getBoundingClientRect(), line = row.getBoundingClientRect();
      const top = line.top - bounds.top + pane.scrollTop - pane.clientTop;
      marker.style.transform = `translateY(${top}px)`;
      if (follow.current && replay.playing && (line.top < bounds.top || line.top + marker.offsetHeight > bounds.bottom)) {
        pane.scrollTo({ top: top - pane.clientHeight * .35, behavior: replay.still ? 'instant' : 'smooth' });
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(row.closest('pre')!);
    return () => { observer.disconnect(); delete row.dataset.executing; };
  }, [activeLine, replay.playing, replay.still]);
  const holdSource = () => { follow.current = false; };
  const holdFeed = () => { followFeed.current = false; };
  useLayoutEffect(() => {
    const el = feed.current;
    if (el && followFeed.current && replay.started) el.scrollTop = el.scrollHeight;
  }, [run.items.length, ended, replay.started]);
  const label = replay.playing ? 'Pause' : ended ? 'Replay' : replay.started ? 'Resume' : 'Play';
  const state = !idea.run ? 'source' : ended ? 'ended' : replay.playing ? 'running' : replay.started ? 'paused' : 'idle';
  return <div className="qs-main" ref={replay.root} data-example-view={idea.view} data-state={state}>
    <div className="qs-actions">
      {picker || <span className="qs-file"><i>{folder}/</i>{idea.id}.mts</span>}
      <CopyButton text={idea.code} label="Copy file" />
      {idea.run && (
        <Button size="sm" variant="outline" className="qs-run" disabled={!line} onClick={() => { if (ended || !replay.started) follow.current = followFeed.current = true; replay.toggle(); }} aria-label={label+' the recorded run'}>{replay.playing ? <Pause aria-hidden="true" fill="currentColor" strokeWidth={0} /> : <Play aria-hidden="true" fill="currentColor" strokeWidth={0} />}<span className="qs-run-label">{label}</span></Button>
      )}
    </div>
    <div className="qs-panes">
      <section className="qs-pane qs-source qs-code" ref={source} data-returns={returnsId} data-active-line={activeLine} tabIndex={0}
        onWheel={holdSource} onPointerDown={holdSource} onKeyDown={holdSource} aria-label={`${idea.id}.mts source`}>
        <style>{[...rows.keys()].map(n => `[data-returns="${returnsId}"] pre > code > span:nth-child(${n + 1}) { padding-bottom: var(--qs-return-line); }`).join('\n')}</style>
        {activeLine && <i aria-hidden="true" ref={band} className="qs-band" />}
        <CodeBlock code={idea.code.trimEnd()} language="ts" label="" showLineNumbers className="rounded-none border-0" />
        <div className="qs-exec">{[...rows].map(([n, row], i) => <span key={n} className="qs-ret" style={{ top: tops.get(n) ?? `calc(var(--font-size-sm) + ${n + 1} * var(--qs-code-line) + ${i} * var(--qs-return-line))`, paddingLeft: `calc(var(--qs-code-gutter) + ${(code[n]?.match(/^ */)?.[0].length ?? 0)}ch)` }}>→ <b>{row.value}</b><i>{row.time}</i></span>)}</div>
      </section>
      <div className="qs-pane qs-machine"><div ref={feed} className="qs-feed" role="region" aria-label="Run" tabIndex={0}
        onWheel={holdFeed} onPointerDown={holdFeed} onKeyDown={holdFeed}>
        {current && <div className="qs-current-call" data-source-line={current.line}><span>Line {current.line}</span><code>{current.label ?? current.name}</code></div>}
        {!replay.started && preview.length > 0 && <p className="qs-preview-label">First recorded step</p>}
        <AgentTimeline className="qs-execution-timeline" items={replay.started ? run.items : preview} isThinking={run.thinking}
          emptyState={<p className="qs-wait">{!idea.run ? 'This example has source code only.' : replay.failed ? 'The recorded run could not load.' : !events ? 'Loading the recorded run…' : !events.length || ended ? 'No steps were recorded.' : 'Waiting for the first recorded step…'}</p>} />
        {ended && idea.output && !events?.some(e => e.kind === 'call' && e.label === idea.output!.call) &&
          <p className="qs-wait">This run has no recorded command output.</p>}
      </div></div>
    </div>
    {showReceipt && idea.run && events && replay.started && <ExampleReceipt idea={idea} events={events} t={t} ended={ended} />}
  </div>;
}

/** Scrolls a sideways row the least that shows `item` whole, from a label's start. */
function reveal(row: HTMLElement, item: HTMLElement, labels: HTMLElement[]) {
  if (row.scrollWidth <= row.clientWidth) return;
  const box = row.getBoundingClientRect(), left = (el: HTMLElement) => el.getBoundingClientRect().left - box.left + row.scrollLeft;
  const inset = left(labels[0]), at = left(item), end = at + item.offsetWidth + inset;
  row.scrollTo({ left: (labels.map(left).find((start) => start <= at && end - start <= row.clientWidth) ?? at) - inset });
}

export interface ExampleWorkbenchProps {
  subjects: Subject[];
  initial?: string;
  /** A site may own the selected key when its surrounding topic and URL need to follow it. */
  value?: string;
  onSelect?: (key: string) => void;
  showReceipt?: boolean;
  playOnSelect?: boolean;
}

export function ExampleWorkbench(props: ExampleWorkbenchProps) {
  return <Editor {...props} compact showReceipt={props.showReceipt ?? false} />;
}

/** A deep link takes precedence over the initial example. */
export function ExampleEditor(props: { subjects: Subject[]; initial?: string; featured?: string[]; showReceipt?: boolean; playOnSelect?: boolean }) {
  return <Editor {...props} />;
}

function Editor({ subjects, initial, featured, value, onSelect, compact = false, showReceipt = true, playOnSelect = false }:
  ExampleWorkbenchProps & { featured?: string[]; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const tasks = useMemo(() => subjects.flatMap((subject) => subject.ideas.map((idea) => ({ key: `${subject.id}/${idea.id}`, subject, idea }))), [subjects]);
  const fallback = initial ?? tasks[0]?.key ?? '';
  const [picked, setPicked] = useState(fallback);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [activation, setActivation] = useState(0);
  const [showAll, setShowAll] = useState(!featured?.length);
  useLayoutEffect(() => {
    const row = root.current?.querySelector<HTMLElement>('.qs-tabs');
    if (!row) return;
    const place = () => { const item = row.querySelector<HTMLElement>('[aria-selected="true"]'); if (item) reveal(row, item, [...row.querySelectorAll<HTMLElement>('[role="tab"]')]); };
    place();
    const observer = new ResizeObserver(place); observer.observe(row);
    return () => observer.disconnect();
  }, [picked]);
  useEffect(() => {
    setReady(true);
    if (value !== undefined) return;
    const read = () => { const value = new URL(window.location.href).searchParams.get('example'); setPicked(tasks.some((task) => task.key === value) ? value! : fallback); };
    const restore = () => { setActivation(0); read(); };
    read(); window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [tasks, fallback, value]);
  const task = tasks.find((item) => item.key === (value ?? picked)) ?? tasks[0];
  if (!task) return null;
  const choose = (key: string) => {
    setActivation(count => count + 1);
    setPicked(key);
    if (compact) setMenuOpen(false);
    onSelect?.(key);
    if (value !== undefined) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('example') !== key) {
      url.searchParams.set('example', key);
      if (compact) window.history.pushState(window.history.state, '', url);
      else window.history.replaceState(window.history.state, '', url);
    }
  };
  const step = (event: React.KeyboardEvent) => { // the arrow keys walk the jobs, as in a file list
    const next = tasks[tasks.indexOf(task) + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0)];
    if (!next || next === task) return;
    event.preventDefault(); choose(next.key);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('.qs-list [aria-pressed="true"]')?.focus());
  };
  const picker = compact && <div className="qs-picker"><DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild disabled={!ready}
        onPointerDownCapture={event => { if (event.button === 0 && !event.ctrlKey) event.stopPropagation(); }}
        onClick={() => setMenuOpen(open => !open)}>
        <Button variant="outline" aria-label={`Example, ${task.idea.title}`}>{task.idea.title}<ChevronDown aria-hidden="true" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="qs-picker-menu" align="start" aria-label="Examples" onCloseAutoFocus={event => {
        event.preventDefault();
        requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('.qs-picker button')?.focus({ preventScroll: true }));
      }}>
        <DropdownMenuRadioGroup value={task.key}>
          {tasks.map(entry => <DropdownMenuRadioItem key={entry.key} value={entry.key} onSelect={() => choose(entry.key)}>
            {entry.idea.title}
          </DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu></div>;
  return <div className={compact ? 'qs-editor qs-workbench dark' : 'qs-editor'} data-theme={compact ? 'website' : undefined} ref={root}>
    {!compact && tasks.length > 1 && featured?.length ? <div className="qs-tabs" role="tablist" aria-label="Recorded runs" onKeyDown={event => {
      const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      const index = featured.indexOf(task.key);
      choose(featured[(index + direction + featured.length) % featured.length]);
      requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus());
    }}>
      {featured.flatMap(key => { const item = tasks.find(task => task.key === key); return item ? [<Button key={key} tabIndex={key === task.key ? 0 : -1} aria-controls={panelId} size="sm" variant="ghost" role="tab" aria-selected={key === task.key} onClick={() => choose(key)}>{item.idea.title}</Button>] : []; })}
      <Button size="sm" variant="ghost" className="qs-all" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>All examples <span aria-hidden="true">▾</span></Button>
    </div> : null}
    {!compact && tasks.length > 1 && showAll && <nav className="qs-nav" aria-label="Examples" onKeyDown={step}>
      {subjects.map((subject) => {
        const open = subject === task.subject;
        return <Fragment key={subject.id}>
          <Button size="sm" variant="ghost" className="qs-group" aria-expanded={open} onClick={() => open || choose(`${subject.id}/${subject.ideas[0].id}`)}>{subject.label}</Button>
          <div className="qs-rows" inert={!open}>
            <div className="qs-list">
              {subject.ideas.map((idea) => <Button key={idea.id} size="sm" variant="ghost" aria-pressed={idea === task.idea} onClick={() => choose(`${subject.id}/${idea.id}`)}>
                {idea.title}
              </Button>)}
            </div>
          </div>
        </Fragment>;
      })}
    </nav>}
    <div id={panelId} role={featured?.length ? "tabpanel" : undefined} aria-label={task.idea.title}><Workspace picker={picker} key={task.key + activation} playOnSelect={playOnSelect || activation > 0} idea={task.idea} folder={task.subject.id} showReceipt={showReceipt} /></div>
  </div>;
}
