import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Terminal } from '@xterm/xterm';
import type { SerializeAddon } from '@xterm/addon-serialize';
import { Button } from '../primitives/button';
import { Slider } from '../primitives/slider';
import { clock, loopedAt, useReplay, type Ev, type Mark } from './run-replay';

// Replays an asciinema v2 recording of a real terminal in xterm.js, loaded only when a replay mounts.
// @xterm/xterm is an optional peer: install it where this component renders. With @xterm/addon-serialize also installed, a
// readable replay narrower than its recording wraps long lines instead of cutting them.
export interface TerminalReplayProps {
  /** URL of an asciinema v2 `.cast` file. */
  src: string;
  /** Names the recording for assistive technology. */
  title?: string;
  /** Text typed into the session; each becomes a scrub-bar marker where it first appears on screen. */
  inputs?: string[];
  autoplay?: boolean;
  /** Render this recorded timestamp in milliseconds; the caller supplies the transport. */
  positionMs?: number;
  /** Milliseconds from a caller's clock, which one clock can share across many replays. The recording plays its paced
   * timeline (idle time compressed as in its own transport), rests `loopHoldMs` on its last frame and starts again.
   * There is no transport bar; the caller pauses it by stopping the clock. */
  elapsedMs?: number;
  /** How long a looping replay rests on the last frame that prints text, before it starts again. */
  loopHoldMs?: number;
  /** Keep terminal text near its native size on narrow screens. The recording still plays at its own columns, and its screen
   * is shown wrapped to the box's columns (or scrolls sideways when @xterm/addon-serialize is not installed). */
  readable?: boolean;
  /** In a cropped preview, bring the recorded row containing this text into view. */
  revealText?: string;
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
const DEFERRED_PEERS = ['@xterm/xterm', '@xterm/addon-serialize'];
const loadXterm = () => import('@xterm/xterm').catch((error: unknown) => { console.error(`TerminalReplay needs ${DEFERRED_PEERS.join(', ')} installed`, error); throw error; });
const loadSerialize = () => import('@xterm/addon-serialize').catch(() => null); // without it, a narrow readable replay scrolls sideways

/** The row of a wrapped view that shows the model's cursor: each of the model's lines starts a line in the view. */
function cursorRow(view: Terminal, model: Terminal) {
  const m = model.buffer.active, v = view.buffer.active;
  let line = -1, start = m.cursorY;
  for (let y = 0; y <= m.cursorY; y++) if (!m.getLine(m.viewportY + y)?.isWrapped) line++;
  while (start > 0 && m.getLine(m.viewportY + start)?.isWrapped) start--;
  const offset = (m.cursorY - start) * model.cols + m.cursorX;
  for (let row = 0, seen = -1; row < view.rows; row++) {
    if (!v.getLine(v.viewportY + row)?.isWrapped) seen++;
    if (seen === line) return row + Math.floor(offset / view.cols);
  }
  return v.cursorY;
}

const IDLE: [number, number] = [2000, 600]; // a still screen over 2 s plays in 0.6 s while the clock sweeps its real length
const marks = (events: Ev[]): Mark[] => events.map((event) => ({ atMs: event.atMs }));

export function TerminalReplay({ src, title = 'Recorded terminal session', inputs, autoplay = true, positionMs, elapsedMs, loopHoldMs = 3000, readable = false, revealText }: TerminalReplayProps) {
  const size = useRef<Cast | null>(null);
  const controlled = positionMs !== undefined || elapsedMs !== undefined; // the caller's clock, not this replay's transport
  const replay = useReplay(src, marks, IDLE, [0, Infinity], undefined, {
    autoplay: !controlled && autoplay,
    read: async (res) => { const cast = parseCast(await res.text()); size.current = cast; return cast.events; },
  });
  const { events, line, r } = replay;
  const output = useMemo(() => (events ?? []).filter((event) => event.kind === 'o'), [events]);
  // A loop rests from the last output that prints text: a trailing control code, such as showing the cursor, changes
  // nothing on screen and would only lengthen the rest.
  const lastPrintR = useMemo(() => {
    const last = output.findLast((event) => plain(event.text ?? ''));
    return (last && line?.marks.findLast((mark) => mark.atMs <= last.atMs)?.r) ?? line?.total ?? 0;
  }, [output, line]);
  const t = positionMs ?? (elapsedMs !== undefined ? (line ? loopedAt(line.anchors, lastPrintR, elapsedMs, loopHoldMs) : 0) : replay.t);
  const markers = useMemo(() => castInputs(events ?? [], inputs), [events, inputs]);
  const screen = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState<Terminal | null>(null);
  // A readable replay plays into `model`, a terminal at the recording's own size that never renders. After each write its
  // screen is serialized into `term`, which has the box's columns, so a TUI laid out for wide columns keeps its layout and
  // the view wraps its long lines. Resizing the terminal itself would garble a TUI's cursor moves.
  const mirror = useRef<{ model: Terminal; serialize: SerializeAddon } | null>(null);
  // Copies the model's screen into the view in one write: a full reset, then the serialized screen, parsed together so no
  // frame shows an empty terminal. Set by the write effect, which knows what to bring into view afterwards.
  const show = useRef<() => void>(() => {});
  const [broken, setBroken] = useState(false);
  const [fit, setFit] = useState({ scale: 1, height: 0 });
  const written = useRef(0);

  useEffect(() => {
    const cast = size.current, el = host.current;
    if (!events || !cast || !el) return;
    let live = true, made: Terminal | undefined, model: Terminal | undefined;
    Promise.all([loadXterm(), readable ? loadSerialize() : null, document.fonts?.ready]).then(([{ Terminal }, addon]) => {
      if (!live) return;
      const style = getComputedStyle(el);
      made = new Terminal({
        cols: cast.width, rows: cast.height, fontSize: 13, fontFamily: style.fontFamily, scrollback: 0,
        disableStdin: true, cursorBlink: false, allowTransparency: true,
        theme: { background: 'rgba(0, 0, 0, 0)', foreground: style.color, cursor: style.color },
      });
      made.open(el);
      if (addon) {
        model = new Terminal({ cols: cast.width, rows: cast.height, scrollback: 0, allowProposedApi: true });
        const serialize = new addon.SerializeAddon();
        model.loadAddon(serialize);
        mirror.current = { model, serialize };
      }
      written.current = 0;
      setTerm(made);
    }).catch(() => { if (live) setBroken(true); });
    return () => { live = false; mirror.current = null; model?.dispose(); made?.dispose(); setTerm(null); };
  }, [events, readable]);

  // The recording keeps its own columns. A narrow screen shows it smaller, and a readable replay that cannot shrink far
  // enough shows the recorded screen wrapped to the columns that fit at 90 percent. A row can draw wider than its columns:
  // box-drawing and block glyphs the mono font lacks come from a fallback font with a wider advance. `stretch` is the widest
  // that overshoot seen, as a ratio of the drawn width, so columns and scale leave room for the widest row ever drawn.
  const stretch = useRef(1);
  useLayoutEffect(() => {
    stretch.current = 1;
    const box = screen.current, drawn = host.current?.querySelector<HTMLElement>('.xterm-screen'), cast = size.current;
    if (!term || !box || !drawn || !cast) return;
    const rows = drawn.querySelector<HTMLElement>('.xterm-rows');
    const measure = () => {
      const wide = drawn.offsetWidth * stretch.current;
      if (mirror.current && drawn.offsetWidth && box.clientWidth) {
        const cell = wide / term.cols;
        const cols = Math.min(cast.width, Math.max(20, Math.floor(box.clientWidth / (cell * 0.9))));
        if (cols !== term.cols) {
          term.resize(cols, cols < cast.width ? cast.height * Math.ceil(cast.width / cols) : cast.height);
          show.current();
          return; // the resize changes the drawn width, and the observer measures again
        }
      }
      const fitWidth = wide ? Math.min(1, box.clientWidth / wide) : 1;
      const scale = Math.max(readable ? 0.9 : 0, fitWidth);
      setFit({ scale, height: drawn.offsetHeight * scale });
    };
    // After each render, a row that drew wider than the terminal widens `stretch` and the fit is measured again.
    const learn = () => {
      if (!rows || !drawn.offsetWidth) return;
      const ratio = rows.scrollWidth / drawn.offsetWidth;
      if (ratio > stretch.current + 0.002) { stretch.current = ratio; measure(); }
    };
    measure();
    const rendered = term.onRender(learn);
    const observer = new ResizeObserver(measure); observer.observe(box); observer.observe(drawn);
    return () => { rendered.dispose(); observer.disconnect(); };
  }, [term, readable]);

  // Playing writes the frames due since the last tick; seeking back redraws from the first frame to the target time.
  useEffect(() => {
    if (!term) return;
    const target = mirror.current?.model ?? term;
    let due = written.current;
    while (due < output.length && output[due].atMs <= t) due++;
    while (due > 0 && output[due - 1].atMs > t) due--;
    const restart = due < written.current;
    if (restart) { target.reset(); written.current = 0; }
    const box = screen.current;
    let live = true;
    const reveal = () => {
      if (!live || !box || !readable || !controlled || box.scrollHeight <= box.clientHeight) return;
      const buffer = term.buffer.active;
      let row = mirror.current ? cursorRow(term, mirror.current.model) : buffer.cursorY;
      if (revealText) {
        for (let index = 0; index < term.rows; index++) {
          if (buffer.getLine(buffer.viewportY + index)?.translateToString(true).includes(revealText)) { row = index; break; }
        }
      }
      box.scrollTop = (row + 1) * box.scrollHeight / term.rows - box.clientHeight * .7;
    };
    show.current = () => { if (mirror.current) term.write(`\x1bc${mirror.current.serialize.serialize({ scrollback: 0 })}`, reveal); };
    if (due > written.current) target.write(output.slice(written.current, due).map((event) => event.text).join(''), mirror.current ? () => { if (live) show.current(); } : reveal);
    else if (restart) show.current();
    written.current = due;
    return () => { live = false; };
  }, [term, output, t, readable, revealText, controlled]);

  const end = output.at(-1)?.atMs ?? 0;
  const at = (atMs: number) => (line ? (line.marks.find((mark) => mark.atMs >= atMs)?.r ?? line.total) / line.total : 0);
  const state = !line || !term ? 'loading' : controlled ? 'controlled' : replay.playing ? 'playing' : 'paused';
  return <section className="mk mk-term" ref={replay.root} aria-label={title} data-state={state} data-readable={readable || undefined}
    data-position-ms={controlled ? Math.round(t) : undefined}>
    <div className="mk-term-screen" ref={screen} style={{ height: fit.height || undefined }}>
      {replay.failed || broken ? <p className="mk-term-note" role="status">The recording could not load.</p> : !term && <p className="mk-term-note" role="status">Loading the recording</p>}
      <div ref={host} className="mk-term-host" style={{ transform: `scale(${fit.scale})` }} aria-hidden="true" />
    </div>
    {!controlled && <div className="mk-term-bar">
      <Button size="icon-sm" variant="ghost" disabled={!line} onClick={replay.toggle} aria-label={replay.playing ? 'Pause the recording' : 'Play the recording'}>
        {replay.playing ? <Pause aria-hidden="true" fill="currentColor" strokeWidth={0} /> : <Play aria-hidden="true" fill="currentColor" strokeWidth={0} />}
      </Button>
      <div className="mk-term-scrub">
        <Slider aria-label="Recording position" max={1} step={0.001} disabled={!line} value={[line ? r / line.total : 1]} onValueChange={([part]) => replay.seek(part)} />
        {markers.map((marker, index) => <button key={index} type="button" className="mk-term-mark" style={{ left: `${at(marker.atMs) * 100}%` }}
          title={marker.label} aria-label={`Jump to input: ${marker.label}`} onClick={() => replay.seek(at(marker.atMs))} />)}
      </div>
      <span className="mk-term-clock">{clock(line ? Math.min(t, end) : 0)} / {clock(end)}</span>
    </div>}
  </section>;
}
