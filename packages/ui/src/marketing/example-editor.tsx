import { AgentTimeline, type AgentTimelineItem } from '../chat/agent-timeline';
import { CodeBlock, CopyButton } from '../markdown/code-block';
import { InlineThinkingItem } from '../run/inline-thinking-item';
import { Button } from '../primitives/button';
import { Slider } from '../primitives/slider';
import { Fragment, useId, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ExampleResult, { ExampleReceipt } from './example-result';
import { useReplay, clock, seconds, usd, returnRows, type Ev, type Mark, type RunMeta } from './run-replay';

// The example editor from tangle.tools: a list of example files, each file's source, and the recorded production run
// beside it. It takes its examples as props and imports no data; style it with @tangle-network/ui/styles/marketing.css.
export interface Idea {
  id: string;
  title: string;
  code: string;
  run?: RunMeta;
  install?: string;
  view?: "timeline" | "page" | "scoreboard" | "states" | "tree" | "spend" | "egress";
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

/** The run so far, as the product's own transcript: what each source line did on the machine, and the agent's words, reasoning and tool calls as they happen. */
function activity(events: Ev[], t: number, source: string[]) {
  const lines = new Map<number, { atMs: number; label: string; done: number; total: number; turn: boolean; state?: string; last?: Ev }>();
  const items = new Map<string, Item>();
  const streamed = events.some((event) => event.data?.part?.type === 'text'); // a newer record carries the agent's own words
  let busy = false;
  for (const event of events) {
    if (event.atMs > t) break;
    const part = event.type === 'message.part.updated' ? event.data?.part : undefined;
    if (event.kind === 'call' && event.line) {
      const done = event.atMs + (event.durationMs ?? 0) <= t;
      let line = lines.get(event.line);
      if (!line) lines.set(event.line, line = { atMs: event.atMs, label: event.label ?? '', done: 0, total: 0, turn: typeof event.result?.response === 'string' });
      line.total++;
      if (done) { line.done++; line.last = event; }
      if (done && line.turn && !streamed) items.set(`a${event.atMs}`, { id: `a${event.atMs}`, atMs: event.atMs + (event.durationMs ?? 0), kind: 'message', role: 'assistant', content: event.result.response });
    } else if (part?.type === 'tool') {
      const status = part.state?.status === 'completed' ? 'success' : part.state?.status === 'error' ? 'error' : 'running';
      items.set(part.id, { id: part.id, atMs: items.get(part.id)?.atMs ?? event.atMs, kind: 'tool', call: { id: part.id, type: 'unknown', label: part.tool, status },
        part: { ...part, state: { ...part.state, input: tidy(part.state?.input) } } });
    } else if (part?.type === 'text' || part?.type === 'reasoning') {
      const end = (event as { endMs?: number }).endMs ?? event.atMs, live = t < end;
      const text = live ? part.text.slice(0, Math.ceil(part.text.length * (t - event.atMs) / (end - event.atMs))) : part.text; // the words arrive over the time they took
      items.set(part.id, part.type === 'text' ? { id: part.id, atMs: event.atMs, kind: 'message', role: 'assistant', content: text, isStreaming: live }
        : { id: part.id, atMs: event.atMs, kind: 'custom', content: <InlineThinkingItem part={{ type: 'reasoning', text, time: { start: event.atMs, end: live ? undefined : end } }} /> });
    } else if (event.type === 'agent.started') items.set(event.data.agentId, { id: event.data.agentId, atMs: event.atMs, kind: 'tool', call: { id: event.data.agentId, type: 'unknown', label: event.data.agentId, detail: event.data.harness, status: 'running' } });
    else if (event.type === 'agent.finished') { const item = items.get(event.data.result?.agentId); if (item?.kind === 'tool') item.call = { ...item.call, status: event.data.result.status === 'completed' ? 'success' : 'error' }; }
  }
  for (const [n, line] of lines) {
    const { done, total, last } = line, running = done < total;
    line.state = running ? 'running' : last && failed(last) ? 'failed' : 'completed';
    const said = source[n - 1]?.match(new RegExp(`\\b${line.label.split('.').pop()}\\(\\s*(["'\`])((?:\\\\.|(?!\\1).)+)\\1`))?.[2]; // the string the call passes: a prompt or a command
    if (line.turn) { busy ||= running; if (said) items.set(`l${n}`, { id: `l${n}`, atMs: line.atMs, kind: 'message', role: 'user', content: said }); continue; }
    const exec = /\.exec$/.test(line.label) && said;
    items.set(`l${n}`, { id: `l${n}`, atMs: line.atMs, kind: 'tool', call: { id: `l${n}`, type: exec ? 'bash' : 'unknown', label: exec ? said : line.label, status: running ? 'running' : line.state === 'failed' ? 'error' : 'success',
      detail: [total > 1 ? `${done}/${total}` : '', last ? brief(last.result) : '', last && total === 1 ? seconds(last.durationMs) : ''].filter(Boolean).join(' · ') } });
  }
  const list = [...items.values()].sort((a, b) => a.atMs - b.atMs);
  const quiet = !list.some((item) => (item.kind === 'tool' && item.call.status === 'running') || (item.kind === 'message' && item.isStreaming));
  return { items: list, thinking: busy && quiet };
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

function Workspace({ idea, folder }: { idea: Idea; folder: string }) {
  const source = useRef<HTMLElement>(null);
  const returnsId = useId();
  const replay = useReplay(idea.run?.url ?? '', marks, IDLE, PLAY_MS, idea.run?.events);
  const { events, t, line, r } = replay;
  const ended = !!line && r >= line.total;
  const code = useMemo(() => idea.code.trimEnd().split('\n'), [idea.code]);
  const rows = useMemo(() => returnRows(events ?? [], t, code, idea.run?.costUsd), [events, t, code, idea.run?.costUsd]);
  const tops = useReturns(source, rows, idea.code);
  const run = useMemo(() => activity(events ?? [], t, code), [events, t, code]);
  const label = replay.playing ? 'Pause' : 'Replay';
  return <div className="qs-main" ref={replay.root} data-state={!idea.run ? 'source' : ended ? 'ended' : replay.playing ? 'running' : 'idle'}>
    <div className="qs-actions">
      <span className="qs-file"><i>{folder}/</i>{idea.id}.mts</span>
      <CopyButton text={idea.code} label="Copy file" />
      {idea.run && <><span className="qs-run-id">{idea.run.runId}</span><span className="qs-stamp">recorded {idea.run.recordedAt.slice(0, 10)} {idea.run.recordedAt.slice(11, 16)} UTC</span><span className="qs-clock">{clock(line ? t : idea.run.ms)}</span>
        <Button size="sm" variant="outline" className="qs-run" disabled={!line} onClick={replay.toggle} aria-label={replay.playing ? 'Pause the recorded run' : 'Replay the recorded run'}><span aria-hidden="true">{replay.playing ? 'Ⅱ' : '▸'}</span><span className="qs-run-label">{label}</span></Button>
        <Slider className="qs-progress" aria-label="Run position" max={1} step={0.001} disabled={!line} value={[line ? r / line.total : 1]} onValueChange={([part]) => replay.seek(part)} /></>}
    </div>
    <div className="qs-panes">
      <section className="qs-pane qs-source qs-code" ref={source} data-returns={returnsId} aria-label={`${idea.id}.mts source`}>
        <style>{[...rows.keys()].map(n => `[data-returns="${returnsId}"] pre > code > span:nth-child(${n + 1}) { padding-bottom: var(--qs-return-line); }`).join('\n')}</style>
        <CodeBlock code={idea.code.trimEnd()} language="ts" label="" showLineNumbers className="rounded-none border-0" />
        <div className="qs-exec">{[...rows].map(([n, row], i) => <span key={n} className="qs-ret" style={{ top: tops.get(n) ?? `calc(var(--font-size-sm) + ${n + 1} * var(--qs-code-line) + ${i} * var(--qs-return-line))`, paddingLeft: `calc(var(--qs-code-gutter) + ${(code[n]?.match(/^ */)?.[0].length ?? 0)}ch)` }}>→ <b>{row.value}</b><i>{row.time}</i></span>)}</div>
      </section>
      {idea.run && <div className="qs-pane qs-machine"><div className="qs-feed" role="region" aria-label="Run" tabIndex={0}>
        {!events ? <p className="qs-wait" role="status">{replay.failed ? 'The run could not load.' : ''}</p> : <>
          {!idea.view && <AgentTimeline items={run.items} isThinking={run.thinking} />}
          <ExampleResult idea={idea} events={events} t={t} />
        </>}
      </div></div>}
    </div>
    {idea.run && events && <ExampleReceipt idea={idea} events={events} t={t} ended={ended} />}
  </div>;
}

/** Scrolls a sideways row the least that shows `item` whole, from a label's start. */
function reveal(row: HTMLElement, item: HTMLElement, labels: HTMLElement[]) {
  if (row.scrollWidth <= row.clientWidth) return;
  const box = row.getBoundingClientRect(), left = (el: HTMLElement) => el.getBoundingClientRect().left - box.left + row.scrollLeft;
  const inset = left(labels[0]), at = left(item), end = at + item.offsetWidth + inset;
  row.scrollTo({ left: (labels.map(left).find((start) => start <= at && end - start <= row.clientWidth) ?? at) - inset });
}

/** `initial` is the `subject/idea` key shown first; without it, the first idea. A `?example=` key in the URL wins. */
export function ExampleEditor({ subjects, initial, featured }: { subjects: Subject[]; initial?: string; featured?: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const tasks = useMemo(() => subjects.flatMap((subject) => subject.ideas.map((idea) => ({ key: `${subject.id}/${idea.id}`, subject, idea }))), [subjects]);
  const fallback = initial ?? tasks[0]?.key ?? '';
  const [picked, setPicked] = useState(fallback);
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
    const read = () => { const value = new URL(window.location.href).searchParams.get('example'); setPicked(tasks.some((task) => task.key === value) ? value! : fallback); };
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [tasks, fallback]);
  const task = tasks.find((item) => item.key === picked) ?? tasks[0];
  if (!task) return null;
  const choose = (value: string) => {
    setPicked(value);
    const url = new URL(window.location.href); url.searchParams.set('example', value);
    window.history.replaceState(window.history.state, '', url);
  };
  const step = (event: React.KeyboardEvent) => { // the arrow keys walk the jobs, as in a file list
    const next = tasks[tasks.indexOf(task) + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0)];
    if (!next || next === task) return;
    event.preventDefault(); choose(next.key);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('.qs-list [aria-pressed="true"]')?.focus());
  };
  // One list, like a folder of files: a subject opens to its jobs, and each job shows how long its run took.
  return <div className="qs-editor" ref={root}>
    {tasks.length > 1 && featured?.length ? <div className="qs-tabs" role="tablist" aria-label="Recorded runs" onKeyDown={event => {
      const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      const index = featured.indexOf(task.key);
      choose(featured[(index + direction + featured.length) % featured.length]);
      requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus());
    }}>
      {featured.flatMap(key => { const item = tasks.find(task => task.key === key); return item ? [<Button key={key} tabIndex={key === task.key ? 0 : -1} aria-controls={panelId} size="sm" variant="ghost" role="tab" aria-selected={key === task.key} onClick={() => choose(key)}>{item.idea.title}<span>{item.idea.run && clock(item.idea.run.ms)}</span></Button>] : []; })}
      <Button size="sm" variant="ghost" className="qs-all" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>All examples <span aria-hidden="true">▾</span></Button>
    </div> : null}
    {tasks.length > 1 && showAll && <nav className="qs-nav" aria-label="Examples" onKeyDown={step}>
      {subjects.map((subject) => {
        const open = subject === task.subject;
        return <Fragment key={subject.id}>
          <Button size="sm" variant="ghost" className="qs-group" aria-expanded={open} onClick={() => open || choose(`${subject.id}/${subject.ideas[0].id}`)}>{subject.label}</Button>
          <div className="qs-rows" inert={!open}>
            <div className="qs-list">
              {subject.ideas.map((idea) => <Button key={idea.id} size="sm" variant="ghost" aria-pressed={idea === task.idea} onClick={() => choose(`${subject.id}/${idea.id}`)}>
                {idea.title}{idea.run && <span aria-hidden="true">{clock(idea.run.ms)}</span>}
              </Button>)}
            </div>
          </div>
        </Fragment>;
      })}
    </nav>}
    <div id={panelId} role={featured?.length ? "tabpanel" : undefined} aria-label={task.idea.title}><Workspace key={task.key} idea={task.idea} folder={task.subject.id} /></div>
  </div>;
}
