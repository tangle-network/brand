import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { InstallRow } from './install-row';
import { TerminalReplay } from './terminal-replay';

/** Where and when a harness's terminal recording was made. `ok` is false when the capture did not finish. */
export interface HarnessCapture { url: string; ok: boolean; recordedAt: string; sandboxId: string; harnessVersion: string; cliVersion: string; durationMs: number }
export interface Harness {
  id: string;
  name: string;
  /** Logo URL; without one the tile shows the name's first letter. */
  logo?: string;
  version?: string;
  /** The create flow with this harness chosen. `null` shows the CLI command instead; omitted, it fills `hrefTemplate`. */
  launchHref?: string | null;
  /** A recording of the harness's terminal session. `null` says none exists yet. */
  capture?: HarnessCapture | null;
  /** Text typed into the recorded session, marked on the scrub bar. */
  inputs?: string[];
}

export interface HarnessStripProps {
  harnesses: Harness[];
  /** Each tile's link, `{id}` replaced by the harness id. Tiles stay plain links unless a harness carries `capture` or `launchHref`. */
  hrefTemplate?: string;
  liveLabel?: string;
  children?: ReactNode;
  /** Shown when a harness has no `launchHref`. */
  commandTemplate?: string;
}

const fill = (template: string, id: string) => template.replace('{id}', encodeURIComponent(id));
const date = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

function Logo({ harness }: { harness: Harness }) {
  return harness.logo ? <img src={harness.logo} alt="" width={44} height={44} loading="lazy" /> : <span className="mk-harness-mono" aria-hidden="true">{harness.name.slice(0, 1)}</span>;
}

function Panel({ harness, id, href, command }: { harness: Harness; id: string; href: string | null; command: string }) {
  const capture = harness.capture?.ok ? harness.capture : null;
  return <div id={id} className="mk-harness-panel" role="region" aria-label={harness.name}>
    {capture ? <>
      <TerminalReplay key={capture.url} src={capture.url} inputs={harness.inputs} title={`${harness.name} terminal session, recorded`} />
      <p className="mk-provenance">
        <span>{harness.name} <b>{capture.harnessVersion}</b></span>
        <span>recorded <b>{date(capture.recordedAt)}</b></span>
        <span>sandbox <b>{capture.sandboxId}</b></span>
        <span>tangle CLI <b>{capture.cliVersion}</b></span>
      </p>
    </> : <p className="mk-harness-empty">No recording of {harness.name} yet.</p>}
    <div className="mk-harness-action">
      {href
        ? <a className="mk-btn mk-primary" href={href} data-track="harness-run-live" data-harness={harness.id}>Run it live</a>
        : <InstallRow command={command} />}
    </div>
  </div>;
}

export function HarnessStrip({ harnesses, hrefTemplate, liveLabel, children, commandTemplate = 'tangle sandbox create --backend {id}' }: HarnessStripProps) {
  const selectable = harnesses.some((harness) => harness.capture !== undefined || harness.launchHref !== undefined);
  const grid = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const [focus, setFocus] = useState(0);
  const [columns, setColumns] = useState(1);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el || !selectable) return;
    const measure = () => setColumns(getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length || 1);
    measure();
    const observer = new ResizeObserver(measure); observer.observe(el);
    return () => observer.disconnect();
  }, [selectable]);
  const move = (index: number) => { setFocus(index); grid.current?.querySelectorAll<HTMLElement>('.mk-harness')[index]?.focus(); };
  const keys = (event: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    if (event.key === 'Escape' && picked != null) { event.preventDefault(); setPicked(null); move(picked); return; }
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? harnesses.length - 1 : step[event.key] != null ? focus + step[event.key] : null;
    if (next == null || next < 0 || next >= harnesses.length) return;
    event.preventDefault(); move(next);
  };
  const harness = picked == null ? null : harnesses[picked];
  // The panel opens under the chosen tile's row and spans the grid's width.
  const after = picked == null ? -1 : Math.min(harnesses.length, Math.ceil((picked + 1) / columns) * columns) - 1;
  return (
    <div className="mk mk-harnesses">
      {children && (
        <div className="mk-live-slot" role="group" aria-label={liveLabel}>
          {children}
        </div>
      )}
      <div className="mk-harness-grid" ref={grid} data-selectable={selectable || undefined} onKeyDown={selectable ? keys : undefined}>
        {harnesses.map((item, index) => {
          const tile = selectable
            ? <button key={item.id} type="button" className="mk-harness" tabIndex={index === focus ? 0 : -1} aria-expanded={index === picked} aria-controls={index === picked ? panelId : undefined}
              data-track="harness-select" data-harness={item.id} onFocus={() => setFocus(index)} onClick={() => setPicked(index === picked ? null : index)}>
              <Logo harness={item} />
              <b>{item.name}</b>
              <code>"{item.id}"</code>
            </button>
            : <a key={item.id} className="mk-harness" href={fill(hrefTemplate ?? '', item.id)} aria-label={`Create a sandbox with ${item.name}`}>
              <Logo harness={item} />
              <b>{item.name}</b>
              <code>"{item.id}"</code>
            </a>;
          if (index !== after || !harness) return tile;
          const href = harness.launchHref === undefined ? (hrefTemplate ? fill(hrefTemplate, harness.id) : null) : harness.launchHref;
          return [tile, <Panel key={`${harness.id}-panel`} harness={harness} id={panelId} href={href} command={commandTemplate.replace('{id}', harness.id)} />];
        })}
      </div>
    </div>
  );
}
