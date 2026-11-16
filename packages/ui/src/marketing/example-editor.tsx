import { AgentTimeline, type AgentTimelineItem } from '../chat/agent-timeline';
import { CodeBlock, CopyButton } from '../markdown/code-block';
import { InlineThinkingItem } from '../run/inline-thinking-item';
import { Button } from '../primitives/button';
import { Slider } from '../primitives/slider';
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ExampleResult from './example-result';
import { useReplay, type Ev, type Mark, type RunMeta } from './run-replay';

// The example editor from tangle.tools: a list of example files, each file's source, and the recorded production run
// beside it. It takes its examples as props and imports no data; style it with @tangle-network/ui/styles/marketing.css.
export interface Idea { id: string; title: string; code: string; run?: RunMeta; install?: string }
export interface Subject { id: string; label: string; install: string; ideas: Idea[] }
/** A replay's clock, m:ss. */
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

const Install = ({ command, label }: { command: string; label: string }) => (
  <div className="qs-install" role="group" aria-label={label}><code><span aria-hidden="true">$ </span>{command}</code><CopyButton key={command} text={command} aria-label="Copy command" /></div>
);

const PLAY_MS: [number, number] = [5000, 20_000]; // every replay lasts this long: a short record plays slower, a long one faster
const IDLE: [number, number] = [2500, 1200]; // a wait over 2.5 s plays in 1.2 s, long enough to see the agent think
const marks = (events: Ev[]): Mark[] => events.flatMap((event) => [{ atMs: event.atMs }, { atMs: event.atMs + (event.durationMs ?? 0) }]);
const seconds = (ms = 0) => (ms < 995 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 9950 ? 1 : 0)} s`);
const usd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;
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
  let active: number | undefined, busy = false;
  for (const event of events) {
    if (event.atMs > t) break;
    const part = event.type === 'message.part.updated' ? event.data?.part : undefined;
    if (event.kind === 'call' && event.line) {
      const done = event.atMs + (event.durationMs ?? 0) <= t;
      let line = lines.get(event.line);
      if (!line) lines.set(event.line, line = { atMs: event.atMs, label: event.label ?? '', done: 0, total: 0, turn: typeof event.result?.response === 'string' });
      line.total++;
      if (done) { line.done++; line.last = event; } else active = event.line;
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
  return { items: list, lines, active, thinking: busy && quiet };
}

/** Each source line's top, height and the free width after its text, inside the scrolling code pane, kept current as it reflows. */
function useLineBoxes(pane: React.RefObject<HTMLElement | null>, code: string) {
  const [boxes, setBoxes] = useState<[number, number, number][]>([]);
  useLayoutEffect(() => {
    const el = pane.current, pre = el?.querySelector('pre');
    if (!el || !pre) return;
    const measure = () => {
      const base = el.getBoundingClientRect().top - el.scrollTop;
      const right = el.getBoundingClientRect().left + el.clientWidth;
      setBoxes([...el.querySelectorAll('pre > code > span')].map((line) => { const box = line.getBoundingClientRect(), ends = [...line.getClientRects()].at(-1); return [box.top - base, box.height, right - (ends?.right ?? right)]; }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(pre);
    return () => observer.disconnect();
  }, [code]);
  return boxes;
}

function Workspace({ idea, folder, install }: { idea: Idea; folder: string; install: string }) {
  const source = useRef<HTMLElement>(null), feed = useRef<HTMLDivElement>(null);
  const replay = useReplay(idea.run?.url ?? '', marks, IDLE, PLAY_MS);
  const { events, t, line, r } = replay;
  const boxes = useLineBoxes(source, idea.code);
  const ended = !!line && r >= line.total, started = r > 0;
  const code = useMemo(() => idea.code.split('\n'), [idea.code]);
  const run = useMemo(() => activity(events ?? [], started ? t : -1, code), [events, t, started]);
  const placed = useRef(0), held = useRef(false); // the reader took the scroll: the transcript stops following until the run restarts or moves
  if (!started) held.current = false;
  useLayoutEffect(() => { // follow the newest row; a finished run, or a result taller than the pane, reads from the result's first line
    const el = feed.current, result = el?.querySelector<HTMLElement>('.qs-result');
    const top = result && (ended || result.scrollHeight > el!.clientHeight) ? result.offsetTop : Infinity;
    if (el && !held.current) placed.current = el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, top);
  });
  const band = run.active !== undefined ? boxes[run.active - 1] : undefined;
  const lastBand = useRef(band);
  if (band) lastBand.current = band;
  useEffect(() => { // keep the running line in the middle third of the pane
    const el = source.current;
    if (!el || !band || (band[0] > el.scrollTop + el.clientHeight * 0.15 && band[0] + band[1] < el.scrollTop + el.clientHeight * 0.8)) return;
    el.scrollTo({ top: band[0] - el.clientHeight * 0.35, behavior: replay.still ? 'auto' : 'smooth' });
  }, [band?.[0]]);
  const made = events?.find((event) => event.kind === 'call' && typeof (event.result?.id ?? event.result?.fleetId) === 'string')?.result;
  const box = (made?.id ?? made?.fleetId) as string | undefined;
  const label = ended ? 'Run again' : replay.playing ? 'Pause' : 'Run';
  return <div className="qs-main" data-state={!idea.run ? 'source' : ended ? 'ended' : replay.playing ? 'running' : 'idle'}>
    <div className="qs-pane qs-source">
      <div className="qs-actions">
        <span className="qs-file"><i>{folder}/</i>{idea.id}.mts</span>
        <CopyButton text={idea.code} aria-label="Copy file" />
        {idea.run && <Button size="sm" className="qs-run" disabled={!line} onClick={replay.toggle} title="Plays the recorded run">{label}</Button>}
      </div>
      <section className="qs-code" ref={source} aria-label={`${idea.id}.mts source`}>
        <CodeBlock code={idea.code} language="ts" label="" showLineNumbers className="rounded-none border-0" />
        <div className="qs-exec" aria-hidden="true">
          {lastBand.current && <i className="qs-band" data-on={!!band || undefined} style={{ transform: `translateY(${lastBand.current[0]}px)`, height: lastBand.current[1] }} />}
          {[...run.lines].map(([n, { state, last }]) => boxes[n - 1] && state !== 'running' && last &&
            <span key={n} className="qs-ret" data-state={state} style={{ top: boxes[n - 1][0] + boxes[n - 1][1] }}>{boxes[n - 1][2] > 240 && <b>{brief(last.result)}</b>}{seconds(last.durationMs)}</span>)}
        </div>
      </section>
      <Install command={idea.install ?? install} label="Install" />
    </div>
    {idea.run && <div className="qs-pane qs-machine" ref={replay.root}>
        <div className="qs-status">
          <span className="qs-box">{box && started ? box : 'sandbox'}</span>
          <span className="qs-clock">{clock(t)}{ended && idea.run.costUsd ? ` · ${usd(idea.run.costUsd)}` : ''}</span>
          <Slider className="qs-progress" aria-label="Run position" max={1} step={0.001} disabled={!line} value={[line ? r / line.total : 0]} onValueChange={([part]) => { held.current = false; replay.seek(part); }} />
        </div>
        {!events ? <p className="qs-wait" role="status">{replay.failed ? 'The run could not load.' : ''}</p> :
          <div className="qs-feed" ref={feed} role="region" aria-label="Run" tabIndex={0} onPointerDown={() => { held.current = true; }} onScroll={(event) => { if (Math.abs(event.currentTarget.scrollTop - placed.current) > 2) held.current = true; }}>
            <AgentTimeline items={run.items} isThinking={run.thinking} />
            <ExampleResult events={events} t={started ? t : -1} />
          </div>}
    </div>}
  </div>;
}

/** Slides one marker to the chosen job: its list reads the job's box from --thumb-* variables. */
function useThumb(root: React.RefObject<HTMLElement | null>, picked: string) {
  useLayoutEffect(() => {
    const place = () => {
      const item = root.current?.querySelector<HTMLElement>('.qs-list [aria-pressed="true"]'), list = item?.parentElement;
      if (!item || !list) return;
      for (const [name, value] of [['x', item.offsetLeft], ['y', item.offsetTop], ['w', item.offsetWidth], ['h', item.offsetHeight]] as const) list.style.setProperty(`--thumb-${name}`, `${value}px`);
      const rows = list.parentElement!;
      if (rows.scrollWidth > rows.clientWidth) rows.scrollTo({ left: item.offsetLeft - (rows.clientWidth - item.offsetWidth) / 2 });
      const nav = rows.parentElement!, group = rows.previousElementSibling as HTMLElement; // a narrow screen scrolls subjects sideways
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: group.offsetLeft - 12 });
    };
    place();
    const observer = new ResizeObserver(place);
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [picked]);
}

/** `initial` is the `subject/idea` key shown first; without it, the first idea. A `?example=` key in the URL wins. */
export function ExampleEditor({ subjects, initial }: { subjects: Subject[]; initial?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const tasks = useMemo(() => subjects.flatMap((subject) => subject.ideas.map((idea) => ({ key: `${subject.id}/${idea.id}`, subject, idea }))), [subjects]);
  const fallback = initial ?? tasks[0]?.key ?? '';
  const [picked, setPicked] = useState(fallback);
  useThumb(root, picked);
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
    <nav className="qs-nav" aria-label="Examples" onKeyDown={step}>
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
    </nav>
    <Workspace key={task.key} idea={task.idea} folder={task.subject.id} install={task.subject.install} />
  </div>;
}
