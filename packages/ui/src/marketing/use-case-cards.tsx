import { useMemo } from 'react';
import { Pause, Play } from 'lucide-react';
import ExampleResult, { ExampleReceipt } from './example-result';
import type { Idea } from './example-editor';
import { Button } from '../primitives/button';
import { callValue, clock, seconds, useReplay, type Ev, type Mark, type RunMeta } from './run-replay';

// Recorded runs as short stories: each step appears at its recorded moment, then the result and where to go next.
export interface UseCase {
  slug: string;
  title: string;
  run: RunMeta;
  /** The receipt's headline; without one, the last call's value. */
  lead?: string;
  links: { label: string; href: string }[];
  templateHref: string;
}
export interface UseCaseCardsProps { cases: UseCase[] }

const PLAY_MS: [number, number] = [4000, 12_000];
const IDLE: [number, number] = [2500, 900];
const marks = (events: Ev[]): Mark[] => events.flatMap((event) => [{ atMs: event.atMs }, { atMs: event.atMs + (event.durationMs ?? 0) }]);
const short = (text: string, max = 64) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** The SDK calls made by recorded time `t`, each with the agent tool calls that finished inside it. */
function steps(events: Ev[], t: number) {
  const tools = events.flatMap((event) => event.kind === 'stream' && event.data?.part?.type === 'tool' && event.data.part.state?.status !== 'running' ? [{ atMs: event.atMs, part: event.data.part }] : []);
  return events.filter((event) => event.kind === 'call' && event.atMs <= t).map((event, index) => {
    const done = event.atMs + (event.durationMs ?? 0) <= t;
    const inside = tools.filter((tool) => tool.atMs >= event.atMs && tool.atMs <= Math.min(t, event.atMs + (event.durationMs ?? 0)));
    const last = inside.at(-1)?.part, command = String(last?.state.input?.command ?? last?.state.input?.file_path ?? '').replace(/^\/bin\/bash -lc /, '');
    return { key: `${event.atMs}-${index}`, label: event.label ?? event.name ?? '', done, value: done ? callValue(event) : '', time: done ? seconds(event.durationMs) : '',
      tools: inside.length, tool: last ? `${last.tool} ${short(command)}` : '', failed: !!event.error || (typeof event.result?.exitCode === 'number' && event.result.exitCode !== 0) };
  });
}

function Card({ item }: { item: UseCase }) {
  const replay = useReplay(item.run.url, marks, IDLE, PLAY_MS, item.run.events, { autoplay: true });
  const { events, t, line, r } = replay;
  const ended = !!line && r >= line.total;
  const idea: Idea = useMemo(() => ({ id: item.slug, title: item.title, code: '', run: item.run, lead: item.lead }), [item]);
  const rows = useMemo(() => steps(events ?? [], t), [events, t]);
  return <article className="mk-story" ref={replay.root} data-state={ended ? 'ended' : replay.playing ? 'playing' : 'paused'} aria-label={item.title}>
    <header className="mk-story-head">
      <h3>{item.title}</h3>
      <span>{item.run.runId} · {item.run.recordedAt.slice(0, 10)}</span>
      <Button size="icon-sm" variant="ghost" disabled={!line} onClick={replay.toggle} aria-label={replay.playing ? 'Pause the recorded run' : 'Replay the recorded run'}>
        {replay.playing ? <Pause aria-hidden="true" fill="currentColor" strokeWidth={0} /> : <Play aria-hidden="true" fill="currentColor" strokeWidth={0} />}
      </Button>
      <span className="mk-story-clock">{clock(line ? t : item.run.ms)}</span>
    </header>
    {!events ? <p className="mk-story-note" role="status">{replay.failed ? 'The run could not load.' : 'Loading the run'}</p> : <>
      <ol className="mk-story-steps">
        {rows.map((row) => <li key={row.key} data-done={row.done || undefined} data-failed={row.failed || undefined}>
          <code>{row.label}</code><b>{row.value}</b><i>{row.time}</i>
          {row.tools > 0 && <small>{row.tools} agent tool {row.tools === 1 ? 'call' : 'calls'}{row.tool && <> · <code>{row.tool}</code></>}</small>}
        </li>)}
      </ol>
      {ended && <div className="mk-story-result" tabIndex={0} role="region" aria-label="Result"><ExampleResult idea={idea} events={events} t={t} /></div>}
      <ExampleReceipt idea={idea} events={events} t={t} ended={ended} />
    </>}
    <footer className="mk-story-links">
      <a className="mk-btn mk-primary" href={item.templateHref} data-track="usecase-template" data-usecase={item.slug}>Use this template</a>
      {item.links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
    </footer>
  </article>;
}

export function UseCaseCards({ cases }: UseCaseCardsProps) {
  return <div className="mk mk-stories">{cases.map((item) => <Card key={item.slug} item={item} />)}</div>;
}
