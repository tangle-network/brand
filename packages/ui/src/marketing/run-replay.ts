import { useEffect, useMemo, useRef, useState } from 'react';

// Replays a recorded run (a JSON record of timed events) at its recorded timing.
export interface RunMeta { url: string; recordedAt: string; runId: string; sha: string; sdk: string; costUsd: number | null; ms: number; exitCode?: number; events?: Ev[] }
export type Ev = { atMs: number; kind: string; durationMs?: number; line?: number; label?: string; name?: string; assign?: string; result?: any; error?: any; type?: string; data?: any; text?: string };
/** A moment the replay shows something new; `hold` keeps the recorded clock still for reading. */
export type Mark = { atMs: number; hold?: number; r?: number };

type Idle = [ms: number, playsIn: number]; // a stretch over `ms` in which nothing new happens plays in `playsIn`, the clock sweeping its real length

/** Replay time `r` for each mark, the anchors that map it back to recorded time, and the squeezed stretches. */
function pace(input: Mark[], [IDLE_MS, JUMP_MS]: Idle) {
  const marks = [...input].sort((a, b) => a.atMs - b.atMs), anchors: [number, number][] = [[0, 0]], jumps: { atMs: number; gap: number }[] = [];
  let r = 0, at = 0;
  for (const mark of marks) {
    const gap = mark.atMs - at;
    if (gap > IDLE_MS) jumps.push({ atMs: at, gap });
    r += gap > IDLE_MS ? JUMP_MS : gap;
    mark.r = r;
    anchors.push([r, mark.atMs]);
    if (mark.hold) anchors.push([(r += mark.hold), mark.atMs]);
    at = mark.atMs;
  }
  return { marks, anchors, jumps, total: r };
}
const recordAt = (anchors: [number, number][], r: number) => {
  const i = anchors.findLastIndex(([x]) => x <= r), [r0, t0] = anchors[i], next = anchors[i + 1];
  return !next || next[0] === r0 ? t0 : t0 + ((r - r0) / (next[0] - r0)) * (next[1] - t0);
};

/** The replay's clock. Visibility pauses work; reduced motion opens the finished record. */
export function useReplay(url: string, marks: (events: Ev[]) => Mark[], idle: Idle = [10_000, 800], [minMs, maxMs]: [number, number] = [0, Infinity], initialEvents?: Ev[]) {
  const root = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Ev[] | null>(initialEvents ?? null), [failed, setFailed] = useState(false);
  const [r, setR] = useState<number | null>(null), [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false), [still, setStill] = useState(false);
  useEffect(() => {
    if (!url || initialEvents) return; // a file with no record has nothing to replay
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then((res) => { if (!res.ok) throw new Error('Record unavailable'); return res.json(); })
      .then((record) => setEvents([...record.events].sort((a: Ev, b: Ev) => a.atMs - b.atMs)))
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true); });
    return () => controller.abort();
  }, [url]);
  const line = useMemo(() => (events ? pace(marks(events), idle) : null), [events]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setStill(media.matches); if (media.matches && line) { setR(line.total); setEnabled(false); } };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [line]);
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25), { threshold: 0.25 });
    if (root.current) io.observe(root.current);
    const update = () => setHidden(document.hidden);
    update(); document.addEventListener('visibilitychange', update);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  const playing = enabled && visible && !hidden && !!line && (r ?? line.total) < line.total;
  useEffect(() => {
    if (!playing || !line) return;
    let last = performance.now(), raf = requestAnimationFrame(function tick(now: number) {
      const dt = Math.max(0, now - last);
      last = now;
      setR((value) => Math.min(line.total, (value ?? line.total) + dt * (line.total > maxMs ? line.total / maxMs : line.total < minMs ? line.total / minMs : 1))); // every record plays in minMs to maxMs
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, line]);
  const toggle = () => { if (line && (r ?? line.total) >= line.total) { setR(0); setEnabled(true); } else setEnabled(!enabled); };
  const seek = (part: number) => line && setR(part * line.total); // the reader drags the run to any moment
  return { root, url, events, failed, line, r: r ?? line?.total ?? 0, t: line ? recordAt(line.anchors, r ?? line.total) : 0, playing, toggle, seek, still, visible: visible && !hidden };
}

/** Display clocks always floor the recorded duration to a whole second. */
export const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
export const seconds = (ms = 0) => ms < 1000 ? `${Math.round(ms)} ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : clock(ms);
export const usd = (n: number) => `$${n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '.00').replace(/(\.\d)$/, '$10')}`;

export function diffStats(patch: string) {
  const files: { name: string; add: number; del: number }[] = [];
  for (const line of patch.split('\n')) {
    if (line.startsWith('diff --git ')) files.push({ name: line.split(' b/')[1], add: 0, del: 0 });
    else if (files.length && line.startsWith('+') && !line.startsWith('+++')) files.at(-1)!.add++;
    else if (files.length && line.startsWith('-') && !line.startsWith('---')) files.at(-1)!.del++;
  }
  return files;
}

export function statementEnd(lines: string[], start: number) {
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    const text = lines[i].replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*$/g, '');
    depth += (text.match(/[({\[]/g) ?? []).length - (text.match(/[)}\]]/g) ?? []).length;
    if (depth <= 0) return i;
  }
  return start;
}

export function callValue(event: Ev, code: string[] = []): string {
  const r = event.result, name = event.name;
  if (event.error) return event.error.message ?? 'failed';
  if (name === 'stop') return 'stopped';
  if (name === 'resume') return 'running';
  if (name === 'kill') return 'killed';
  if (r == null) return name === 'delete' ? 'deleted' : '';
  if (name === 'create') return r.previewId ? r.url.replace(/^https:\/\//, '') : r.fleetId ? `${r.fleetId.slice(0, 22)}…` : r.id ?? '';
  if (name === 'prompt') return r.success ? 'success' : 'failed';
  if (name === 'exec') return `exit ${r.exitCode}`;
  if (name === 'branch') return `${r.length} running`;
  if (name === 'read') return `${new TextEncoder().encode(r).length} bytes`;
  if (name === 'download') return `${code[(event.line ?? 1) - 1]?.match(/\.download\("([^"]+)"/)?.[1]?.split('/').at(-1) ?? 'file'}, ${r.sizeBytes.toLocaleString('en-US')} bytes`;
  if (name === 'spawn') return `pid ${r.pid}`;
  if (name === 'fetch') return String(r.status);
  if (name === 'runAll') return `${r.length} results`;
  if (name === 'spend') return `spentUsd ${r.spentUsd.toFixed(4)}`;
  if (name === 'cancel') return `{ interrupted: ${r.interrupted} }`;
  if (name === 'evaluate') return `suite mean ${r.aggregates?.byJudge?.suite?.mean}`;
  return r.outcome ?? r.status ?? (typeof r === 'string' ? r : '');
}

export function returnRows(events: Ev[], t: number, code: string[], cost?: number | null) {
  const groups = new Map<number, Ev[]>();
  for (const event of events) if (event.kind === 'call' && event.line && event.atMs + (event.durationMs ?? 0) <= t) {
    const end = statementEnd(code, event.line - 1);
    groups.set(end, [...(groups.get(end) ?? []), event]);
  }
  const rows = new Map([...groups].map(([end, calls]) => {
    const last = calls.at(-1)!, durations = calls.map(e => e.durationMs ?? 0);
    const value = calls.length > 1 && last.name === 'create' ? 'a new sandbox' : callValue(last.name === 'spend' ? last : calls[0], code);
    const lo = seconds(Math.min(...durations)), hi = seconds(Math.max(...durations));
    return [end, { value: `${value}${calls.length > 1 ? ` ×${calls.length}` : ''}`, time: lo === hi ? lo : `${lo} to ${hi}` }];
  }));
  // Accounting stdout belongs to its source statement, never to the transcript.
  const usage = events.find(e => e.kind === 'stdout' && e.atMs <= t && /inputTokens/.test(e.text ?? ''));
  const usageLine = usage && code.findIndex(line => /console\.log\(.*\.usage/.test(line));
  if (usageLine != null && usageLine >= 0 && cost != null) rows.set(statementEnd(code, usageLine), { value: usd(cost), time: '' });
  return new Map([...rows].sort(([a], [b]) => a - b));
}
