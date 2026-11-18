import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Terminal } from '@xterm/xterm';
import { Button } from '../primitives/button';
import { Slider } from '../primitives/slider';
import { clock, useReplay, type Ev, type Mark } from './run-replay';

// Replays an asciinema v2 recording of a real terminal in xterm.js, loaded only when a replay mounts.
// @xterm/xterm is an optional peer: install it where this component renders.
export interface TerminalReplayProps {
  /** URL of an asciinema v2 `.cast` file. */
  src: string;
  /** Names the recording for assistive technology. */
  title?: string;
  /** Text typed into the session; each becomes a scrub-bar marker where it first appears on screen. */
  inputs?: string[];
  autoplay?: boolean;
}

interface Cast { width: number; height: number; events: Ev[] }
type CastInput = { atMs: number; label: string };

/** An asciinema v2 file: a JSON header line, then `[seconds, code, data]` lines. */
function parseCast(text: string): Cast {
  const [head, ...lines] = text.split('\n').filter((line) => line.trim());
  const header = JSON.parse(head ?? '{}');
  const events = lines.map((line) => { const [at, kind, data] = JSON.parse(line); return { atMs: at * 1000, kind, text: String(data) }; });
  return { width: header.width ?? 80, height: header.height ?? 24, events };
}

// Screen text with escapes and all whitespace removed, so a line the TUI wrapped still matches what was typed.
const plain = (text: string) => text.replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b\[[0-9;?<>=]*[ -/]*[@-~]|\x1b[@-_]|[\x00-\x1f\x7f]/g, '').replace(/\s+/g, '');

/** Input markers: `i` keystrokes up to each Enter, `m` markers, and given input text where the screen first shows it whole. */
function castInputs(events: Ev[], inputs: string[] = []): CastInput[] {
  const found: CastInput[] = [];
  let typed = '';
  for (const event of events) {
    if (event.kind === 'm') found.push({ atMs: event.atMs, label: event.text || 'Marker' });
    if (event.kind !== 'i') continue;
    for (const char of event.text ?? '') {
      if (char === '\r' || char === '\n') { if (typed.trim()) found.push({ atMs: event.atMs, label: typed.trim() }); typed = ''; }
      else if (char === '\x7f') typed = typed.slice(0, -1);
      else if (char >= ' ') typed += char;
    }
  }
  const output = events.filter((event) => event.kind === 'o');
  const starts: number[] = [];
  let screen = '';
  for (const event of output) { starts.push(screen.length); screen += plain(event.text ?? ''); }
  let from = 0; // inputs are in the order they were typed
  for (const input of inputs) {
    const needle = plain(input), at = needle ? screen.indexOf(needle, from) : -1;
    if (at < 0) continue;
    from = at + needle.length;
    const end = at + needle.length, index = starts.findLastIndex((start) => start < end);
    found.push({ atMs: output[index].atMs, label: input });
  }
  return found.sort((a, b) => a.atMs - b.atMs);
}

// Optional peers this module reaches only through import(); scripts/validate-dist.mjs keeps the same list.
const DEFERRED_PEERS = ['@xterm/xterm'];
const loadXterm = () => import('@xterm/xterm').catch((error: unknown) => { console.error(`TerminalReplay needs ${DEFERRED_PEERS.join(', ')} installed`, error); throw error; });

const IDLE: [number, number] = [2000, 600]; // a still screen over 2 s plays in 0.6 s while the clock sweeps its real length
const marks = (events: Ev[]): Mark[] => events.map((event) => ({ atMs: event.atMs }));

export function TerminalReplay({ src, title = 'Recorded terminal session', inputs, autoplay = true }: TerminalReplayProps) {
  const size = useRef<Cast | null>(null);
  const replay = useReplay(src, marks, IDLE, [0, Infinity], undefined, {
    autoplay,
    read: async (res) => { const cast = parseCast(await res.text()); size.current = cast; return cast.events; },
  });
  const { events, line, t, r } = replay;
  const output = useMemo(() => (events ?? []).filter((event) => event.kind === 'o'), [events]);
  const markers = useMemo(() => castInputs(events ?? [], inputs), [events, inputs]);
  const screen = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState<Terminal | null>(null);
  const [broken, setBroken] = useState(false);
  const [fit, setFit] = useState({ scale: 1, height: 0 });
  const written = useRef(0);

  useEffect(() => {
    const cast = size.current, el = host.current;
    if (!events || !cast || !el) return;
    let live = true, made: Terminal | undefined;
    Promise.all([loadXterm(), document.fonts?.ready]).then(([{ Terminal }]) => {
      if (!live) return;
      const style = getComputedStyle(el);
      made = new Terminal({
        cols: cast.width, rows: cast.height, fontSize: 13, fontFamily: style.fontFamily, scrollback: 0,
        disableStdin: true, cursorBlink: false, allowTransparency: true,
        theme: { background: 'rgba(0, 0, 0, 0)', foreground: style.color, cursor: style.color },
      });
      made.open(el);
      written.current = 0;
      setTerm(made);
    }).catch(() => { if (live) setBroken(true); });
    return () => { live = false; made?.dispose(); setTerm(null); };
  }, [events]);

  // The recording keeps its own columns; a narrow screen shows it smaller instead of reflowing it.
  useLayoutEffect(() => {
    const box = screen.current, drawn = host.current?.querySelector<HTMLElement>('.xterm-screen');
    if (!term || !box || !drawn) return;
    const measure = () => { const scale = drawn.offsetWidth ? Math.min(1, box.clientWidth / drawn.offsetWidth) : 1; setFit({ scale, height: drawn.offsetHeight * scale }); };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(box); observer.observe(drawn);
    return () => observer.disconnect();
  }, [term]);

  // Playing writes the frames due since the last tick; seeking back redraws from the first frame to the target time.
  useEffect(() => {
    if (!term) return;
    let due = written.current;
    while (due < output.length && output[due].atMs <= t) due++;
    while (due > 0 && output[due - 1].atMs > t) due--;
    if (due < written.current) { term.reset(); written.current = 0; }
    if (due > written.current) term.write(output.slice(written.current, due).map((event) => event.text).join(''));
    written.current = due;
  }, [term, output, t]);

  const end = output.at(-1)?.atMs ?? 0;
  const at = (atMs: number) => (line ? (line.marks.find((mark) => mark.atMs >= atMs)?.r ?? line.total) / line.total : 0);
  return <section className="mk mk-term" ref={replay.root} aria-label={title} data-state={!line ? 'loading' : replay.playing ? 'playing' : 'paused'}>
    <div className="mk-term-screen" ref={screen} style={{ height: fit.height || undefined }}>
      {replay.failed || broken ? <p className="mk-term-note" role="status">The recording could not load.</p> : !term && <p className="mk-term-note" role="status">Loading the recording</p>}
      <div ref={host} className="mk-term-host" style={{ transform: `scale(${fit.scale})` }} aria-hidden="true" />
    </div>
    <div className="mk-term-bar">
      <Button size="icon-sm" variant="ghost" disabled={!line} onClick={replay.toggle} aria-label={replay.playing ? 'Pause the recording' : 'Play the recording'}>
        {replay.playing ? <Pause aria-hidden="true" fill="currentColor" strokeWidth={0} /> : <Play aria-hidden="true" fill="currentColor" strokeWidth={0} />}
      </Button>
      <div className="mk-term-scrub">
        <Slider aria-label="Recording position" max={1} step={0.001} disabled={!line} value={[line ? r / line.total : 1]} onValueChange={([part]) => replay.seek(part)} />
        {markers.map((marker, index) => <button key={index} type="button" className="mk-term-mark" style={{ left: `${at(marker.atMs) * 100}%` }}
          title={marker.label} aria-label={`Jump to input: ${marker.label}`} onClick={() => replay.seek(at(marker.atMs))} />)}
      </div>
      <span className="mk-term-clock">{clock(line ? Math.min(t, end) : 0)} / {clock(end)}</span>
    </div>
  </section>;
}
