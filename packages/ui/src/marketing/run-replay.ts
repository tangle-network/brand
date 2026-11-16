import { useEffect, useMemo, useRef, useState } from 'react';

// Replays a recorded run (a JSON record of timed events) at its recorded timing.
export interface RunMeta { url: string; recordedAt: string; runId: string; sha: string; sdk: string; costUsd: number | null; ms: number }
export type Ev = { atMs: number; kind: string; durationMs?: number; line?: number; label?: string; assign?: string; result?: any; error?: any; type?: string; data?: any; text?: string };
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
export function useReplay(url: string, marks: (events: Ev[]) => Mark[], idle: Idle = [10_000, 800], [minMs, maxMs]: [number, number] = [0, Infinity]) {
  const root = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<Ev[] | null>(null), [failed, setFailed] = useState(false);
  const [r, setR] = useState(0), [enabled, setEnabled] = useState(true);
  const [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false), [still, setStill] = useState(false);
  useEffect(() => {
    if (!url) return; // a file with no record has nothing to replay
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
  const playing = enabled && visible && !hidden && !!line && r < line.total;
  useEffect(() => {
    if (!playing || !line) return;
    let last = performance.now(), raf = requestAnimationFrame(function tick(now: number) {
      const dt = Math.max(0, now - last);
      last = now;
      setR((value) => Math.min(line.total, value + dt * (line.total > maxMs ? line.total / maxMs : line.total < minMs ? line.total / minMs : 1))); // every record plays in minMs to maxMs
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, line]);
  const toggle = () => { if (line && r >= line.total) { setR(0); setEnabled(true); } else setEnabled(!enabled); };
  const seek = (part: number) => line && setR(part * line.total); // the reader drags the run to any moment
  return { root, url, events, failed, line, r, t: line ? recordAt(line.anchors, r) : 0, playing, toggle, seek, still, visible: visible && !hidden };
}
