import { File, CircleCheck, Download, Lock } from 'lucide-react';
import { AgentTimeline, type AgentTimelineItem } from '../chat/agent-timeline';
import type { Idea } from './example-editor';
import { Markdown } from '../markdown/markdown';
import { useMemo } from 'react';
import { clock, seconds, usd, diffStats, runFacts, callValue, type Ev } from './run-replay';

/** What the run has produced by recorded time `t`: printed output, test results, the patch, scores and each fleet agent's answer. The timeline beside it shows the work. */
function GenericResult({ events, t }: { events: Ev[]; t: number }) {
  const result = useMemo(() => {
    const calls = events.filter((event) => event.kind === 'call' && event.atMs + (event.durationMs ?? 0) <= t);
    const outputs = calls.filter((event) => typeof event.result?.stdout === 'string' && event.result.stdout.trim());
    const { patch, tests } = runFacts(calls);
    const answers = events.flatMap((event, key) => {
      const agent = event.type === 'agent.finished' && event.atMs <= t ? event.data?.result : undefined;
      const text = agent?.result?.response;
      return agent ? [{ key, text: typeof text === 'string' ? text : '', agent: agent.agentId, status: agent.status, error: agent.error ?? agent.result?.error }] : [];
    });
    const assessments = calls.filter((event) => event.label === 'judge.score');
    const errors = calls.flatMap((event) => {
      const error = event.error?.message ?? event.result?.error?.message ?? event.result?.error;
      const exit = event.result?.exitCode;
      const bad = typeof exit === 'number' && exit !== 0; // a command that exits 0 may still write notices to stderr
      return error || bad ? [`${bad ? `Command exited ${exit}\n` : ''}${String(error ?? event.result?.stderr ?? '')}`] : [];
    });
    const consoleText = events.filter((event) => event.atMs <= t && ['stdout', 'stderr'].includes(event.kind))
      .map((event) => event.text ?? '').join('');
    const shown = [...answers.map((answer) => answer.text), ...calls.map((event) => event.result?.response)].filter((text): text is string => typeof text === 'string' && !!text.trim()); // the transcript already shows each answer
    const remainingConsole = shown.reduce((text, answer) => text.replace(answer.trim(), ''), consoleText);
    const consoleOutput = assessments.length || answers.some((answer) => answer.agent) || /\b(?:inputTokens|outputTokens|cacheReadTokens)\b/.test(remainingConsole) || !remainingConsole.trim() ? '' : remainingConsole;
    return { patch, tests, answers, assessments, errors, consoleText: consoleOutput,
      output: outputs.filter((event) => event.result.stdout !== patch && event.result.stdout !== tests && !consoleOutput.includes(event.result.stdout.trim())).map((event) => event.result.stdout).join('\n') };
  }, [events, t]);

  const empty = !result.answers.length && !result.output && !result.consoleText && !result.errors.length && !result.assessments.length && !result.tests;
  if (empty) return null;
  return <div className="qs-result">
    <div className="qs-output">
        {result.errors.map((error, index) => <pre key={index} className="qs-error">{error}</pre>)}
        {result.consoleText &&
          (/^#{1,6} /m.test(result.consoleText) ? <Markdown>{result.consoleText}</Markdown> : <pre>{result.consoleText}</pre>)}
        {result.tests ? <>

          {result.patch && <>
            <pre className="qs-diff">{result.patch.split('\n').filter((line) => !/^(?:index |--- |\+\+\+ )/.test(line)).map((line, index) => {
              const file = line.match(/^diff --git a\/(\S+)/)?.[1];
              return <span key={index} data-line={file ? 'file' : line.startsWith('@@') ? 'hunk' : line[0] === '+' ? 'add' : line[0] === '-' ? 'del' : undefined}>{file ?? line}{'\n'}</span>;
            })}</pre>

          </>}
        </> : <>
          {result.answers.map((answer) => <div key={answer.key}>
            <p className="qs-agent">{answer.agent}{answer.status && answer.status !== 'completed' ? ` · ${answer.status}` : ''}</p>
            {answer.error && <p className="qs-error">{String(answer.error)}</p>}
            <Markdown>{answer.text}</Markdown>
          </div>)}
          {result.assessments.map((event, index) => <div className="qs-assessment" key={index}>
            <p className="qs-test-result">Score {String(event.result.composite)}</p>
            <dl>{Object.entries(event.result.dimensions ?? {}).map(([name, score]) => <div key={name}><dt>{name}</dt><dd>{String(score)}</dd></div>)}</dl>
            <p>{event.result.notes}</p>
          </div>)}
          {result.output && <pre>{result.output}</pre>}
        </>}
    </div>
  </div>;
}

const completed = (events: Ev[], t: number) => events.filter(e => e.kind === 'call' && e.atMs + (e.durationMs ?? 0) <= t);
const printed = (events: Ev[], t: number) => events.filter(e => e.kind === 'stdout' && e.atMs <= t).map(e => (e.text ?? '').trim());
function scoreRows(events: Ev[], code: string) {
  const split = events.find(e => e.kind === 'stdout')?.atMs ?? Infinity;
  const names = [...code.matchAll(/backend:\s*\{\s*type:\s*"([^"]+)"/g)].map(m => m[1]);
  // The source runs each backend in order; evaluate results preserve that same order.
  const sequence = code.match(/for \(const \w+ of \[([^\]]+)\]/)?.[1];
  const backends = sequence ? [...sequence.matchAll(/"([^"]+)"/g)].map(m => m[1]) : [...new Set(names)];
  const assessments = events.filter(e => e.name === 'evaluate');
  return assessments.map((event, i) => {
    const aggregates = event.result.aggregates;
    const scenarios = Object.keys(aggregates.byScenario);
    const turns = events.filter(e => e.name === 'prompt' && (i === 0 ? e.atMs < split : e.atMs >= split));
    return { name: backends[i] ?? String(i + 1), aggregates, scenarios, times: scenarios.map(s => turns.find(e => {
      const response = String(e.result.response);
      return scenarios.filter(c => response.includes(c)).sort((a, b) => response.indexOf(a) - response.indexOf(b))[0] === s;
    })?.durationMs ?? 0) };
  });
}

/** One receipt for the entire recorded window. */
export function ExampleReceipt({ idea, events, t, ended }: { idea: Idea; events: Ev[]; t: number; ended: boolean }) {
  if (!ended) return <div className="qs-receipt" aria-live="polite"><span>{clock(t)}</span></div>;
  const calls = completed(events, t);
  const { patch, tests, passed } = runFacts(calls);
  let lead = idea.lead, facts: string[] = [];
  if (patch && tests) {
    const files = diffStats(patch);
    lead ??= `${passed} tests passed`;
    facts = [`${files.length} files changed`, `+${files.reduce((n, f) => n + f.add, 0)} −${files.reduce((n, f) => n + f.del, 0)}`];
  } else if (idea.view === 'page') {
    const fetch = calls.find(e => e.name === 'fetch');
    lead ??= `HTTP ${fetch?.result.status}`;
    facts = [String(calls.find(e => e.result?.previewId)?.result.url ?? '').replace(/^https:\/\//, '')];
  } else if (idea.view === 'spend') {
    const spend = calls.findLast(e => e.name === 'spend')?.result, cancel = calls.find(e => e.name === 'cancel');
    lead ??= cancel ? `fleet.cancel() at ${clock(cancel.atMs)}` : '';
    facts = spend ? [`${usd(Number(spend.spentUsd.toFixed(2)))} spent of a ${usd(spend.capUsd).replace(/\.00$/, '')} budget`] : [];
  } else if (idea.view === 'scoreboard') {
    const rows = scoreRows([...calls, ...events.filter(e => e.kind === 'stdout' && e.atMs <= t)], idea.code);
    const parts = rows.map(row => `${row.name} ${row.scenarios.filter(s => row.aggregates.byScenario[s].meanComposite === 1).length} of ${row.scenarios.length}`);
    lead ??= parts.shift(); facts = parts;
  } else if (idea.view === 'timeline') {
    const download = calls.find(e => e.name === 'download'), read = calls.find(e => e.name === 'read');
    const file = idea.code.match(/\.download\("([^"]+)"/)?.[1]?.split('/').at(-1);
    const readPath = idea.code.match(/\.read\("([^"]+)"/)?.[1]?.split('/').at(-1);
    lead ??= download && read ? `${file} and ${readPath} written` : undefined;
    facts = download && idea.run?.exitCode != null ? [`exit ${idea.run.exitCode}`] : [];
  } else if (idea.view === 'tree' || idea.view === 'states') facts = [`exit ${calls.filter(e => e.name === 'exec').at(-1)?.result.exitCode}`];
  const outputExit = idea.output && calls.findLast(e => e.label === idea.output?.call)?.result?.exitCode;
  if (typeof outputExit === 'number') lead ??= `Exit ${outputExit}`;
  const lastCall = calls.at(-1);
  lead ??= lastCall ? callValue(lastCall, idea.code.trimEnd().split('\n')) : '';
  if (!lead && idea.run?.exitCode != null) lead = `exit ${idea.run.exitCode}`;
  if (idea.view !== 'spend') {
    facts.push(clock(idea.run?.ms ?? t));
    if (idea.run?.costUsd != null && idea.run.costUsd > 0) facts.push(`${usd(idea.run.costUsd)} in model calls`);
  }
  return <div className="qs-receipt" role="status"><span className="qs-receipt-lead"><CircleCheck aria-hidden="true" />{lead}</span>{facts.map((fact, i) => <span key={i}>· <span>{/^\+\d+ −\d+$/.test(fact) ? <><b>{fact.split(" ")[0]}</b> <s>{fact.split(" ")[1]}</s></> : fact}</span></span>)}{patch && <a className="qs-patch" download={idea.code.match(/writeFile\("([^"]+)"/)?.[1] ?? 'changes.patch'} href={`data:text/plain;charset=utf-8,${encodeURIComponent(patch)}`}><Download aria-hidden="true" />Download patch</a>}</div>;
}

function Timeline({ idea, events, t }: { idea: Idea; events: Ev[]; t: number }) {
  const calls = completed(events, t), tools = new Map<string, { part: any; start: number; end: number }>();
  for (const e of events) {
    const p = e.kind === 'stream' ? e.data?.part : undefined;
    if (e.atMs > t || p?.type !== 'tool') continue;
    tools.set(p.id, { part: p, start: tools.get(p.id)?.start ?? e.atMs, end: e.atMs });
  }
  const list = [...tools.values()].filter(tool => tool.part.state.status !== 'running');
  const browser = idea.code.includes('.download(');
  const downloadPath = idea.code.match(/\.download\("([^"]+)"/)?.[1] ?? '';
  const facts = runFacts(events.filter(e => e.atMs <= t));
  const testTools = list.filter(tool => { const result = facts.outputs.get(String(tool.part.state.output ?? '')); return result?.passed != null || result?.failure; });
  const promptStart = idea.code.indexOf('.prompt('), promptEnd = idea.code.indexOf(');', promptStart);
  const prompt = [...idea.code.slice(promptStart, promptEnd).matchAll(/"((?:\\.|[^"\\])*)"/g)].map(m => JSON.parse(`"${m[1]}"`)).join('');
  const items: AgentTimelineItem[] = [{ id: 'prompt', kind: 'custom', content: <div className="qs-bubble">{prompt.split(/(`[^`]+`)/g).map((part, i) => part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part)}</div> }];
  const commandOf = (tool: typeof list[number]) => String(tool.part.state.input?.command ?? '');
  const written = list.find(tool => tool.part.tool === 'Write');
  const script = String(written?.part.state.input?.file_path ?? '').split('/').at(-1);
  const visible = browser ? [
    list.find(tool => /"code":"EGRESS_DOMAIN_NOT_ALLOWED"/.test(String(tool.part.state.output))),
    written,
    list.findLast(tool => tool.part.tool === 'Bash' && !!script && commandOf(tool).includes(script)),
    list.find(tool => commandOf(tool).startsWith('ls -la ') && !!downloadPath && commandOf(tool).includes(downloadPath)),
  ].filter((tool): tool is typeof list[number] => !!tool) : list.filter(tool => testTools.includes(tool) || tool.part.tool === 'Edit' && tool.part.state.status === 'completed');
  const folded = browser ? list.filter(tool => /pip install/.test(commandOf(tool))).slice(0, 1) : list.slice(0, Math.max(0, list.indexOf(visible[0])));
  const summary = folded.map(tool => {
    const command = commandOf(tool);
    if (browser) return command.match(/pip install(?: --?[^ ]+)* (\w+)/)?.[1] ? `pip install ${command.match(/pip install(?: --?[^ ]+)* (\w+)/)![1]}` : command;
    return command.split('&&')[0].replace(/ -type .*$/, '').replace(/\s+2>&1.*$/, '').replace(/(npm install).*/, '$1').trim();
  }).join(' · ');
  if (folded.length) items.push({ id: 'setup', kind: 'fold', summary, items: folded.map((tool, i) => ({
    id: `setup-${i}`, kind: 'tool', call: { id: String(i), type: 'unknown', label: tool.part.tool, detail: commandOf(tool), status: 'success' },
  })) });
  const texts = events.filter(e => e.atMs <= t && e.kind === 'stream' && e.data?.part?.type === 'text');
  const firstSay = idea.timelineNoteAt == null ? texts[0] : texts.find(e => e.atMs === idea.timelineNoteAt);
  const repo = idea.code.match(/git:\s*\{\s*url:\s*"([^"]+)"/)?.[1]?.split('/').at(-1)?.replace(/\.git$/, '');
  const seen = new Set<string>();
  for (const [i, tool] of visible.entries()) {
    const p = tool.part, st = p.state, input = st.input ?? {}, output = String(st.output ?? '');
    let command = String(input.command ?? input.file_path ?? '').replace(/^\/home\/agent\//, '').replace(/^cd .*? && /, '');
    if (repo && command.startsWith(`${repo}/`)) command = command.slice(repo.length + 1);
    if (p.tool === 'Edit' && seen.has(command)) continue;
    seen.add(command);
    if (browser && p.tool === 'Bash') {
      command = command.match(/ -m (.*?)(?: 2>&1|$)/)?.[1]
        ?? (script && command.includes(script) ? `python ${script}` : command.split(';')[0].replace(/\/[^ ]*\/([^ /]+)/g, '$1'));
    }
    const refusal = output.match(/"code":"(\w+)","host":"([^"]+)"/);
    const { passed, failed, failure } = facts.outputs.get(output) ?? {};
    const line = refusal ? `403 ${refusal[1]} ${refusal[2]}` : failure ?? (passed != null ? `# pass ${passed}` : output.split('\n').find(l => /^-rw/.test(l)));
    items.push({ id: `tool-${i}`, kind: 'custom', content: <div className="qs-tool"><span>{p.tool}</span><b>{command}</b><i>{seconds(tool.end - tool.start)}</i>{line && <div data-tone={refusal || failure ? 'error' : passed != null ? 'success' : undefined}>{passed != null ? `# pass ${passed}  # fail ${failed}` : line}</div>}</div> });
    if (i === 0 && firstSay) items.push({ id: 'say', kind: 'custom', content: <div className="qs-say">{String(firstSay.data.part.text).split(/(`[^`]+`)/g).map((part, i) => part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part)}</div> });
  }
  if (browser) {
    const lastSay = texts.at(-1)?.data.part.text.split('\n')[0];
    if (lastSay) items.push({ id: 'done', kind: 'custom', content: <div className="qs-say">{lastSay}</div> });
    const download = calls.find(e => e.name === 'download'), read = calls.find(e => e.name === 'read');
    const ls = list.find(tool => commandOf(tool).startsWith('ls -la ') && !!downloadPath && commandOf(tool).includes(downloadPath));
    const dims = String(ls?.part.state.output ?? '').match(/PNG image data, (\d+) x (\d+)/);
    if (download) items.push({ id: 'image', kind: 'custom', content: <div className="qs-artifact"><span><File aria-hidden="true" /></span><b>{idea.code.match(/\.download\("([^"]+)"/)?.[1]?.split('/').at(-1)}</b><i>{dims && `${dims[1]}×${dims[2]} · `}{download.result.sizeBytes.toLocaleString('en-US')} bytes</i></div> });
    if (read) items.push({ id: 'json', kind: 'custom', content: <div className="qs-artifact"><span><File aria-hidden="true" /></span><b>{idea.code.match(/\.read\("([^"]+)"/)?.[1]?.split('/').at(-1)}</b><i>JSON array · {new TextEncoder().encode(read.result).length} bytes</i></div> });
  }
  const { patch } = runFacts(calls);
  return <><AgentTimeline items={items} className="qs-record-timeline" />{patch && <><div className="qs-files">{diffStats(patch).map(f => <div key={f.name}><span>{f.name}</span><span><b>+{f.add}</b> <s>−{f.del}</s></span></div>)}</div><pre className="qs-diff">{patch.split('\n').slice(4, 18).map((line, i) => <span key={i} data-line={line.startsWith('@@') ? 'hunk' : line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : undefined}>{line}{'\n'}</span>)}</pre></>}</>;
}

/** Keep malformed or unexpected recorded data readable as the original stdout. */
function tableRows(stdout: string, width: number): (string | number)[][] | undefined {
  try {
    const rows: unknown = JSON.parse(stdout);
    if (!Array.isArray(rows) || !rows.length) return;
    const matches = rows.every(row => Array.isArray(row) && row.length === width &&
      row.every(cell => typeof cell === 'string' || typeof cell === 'number'));
    if (matches) return rows;
  } catch { /* A command can print any text. */ }
}

export function RecordedOutput({ output, calls, hasRecordedCall }: { output: NonNullable<Idea['output']>; calls: Ev[]; hasRecordedCall: boolean }) {
  const event = calls.findLast(call => call.label === output.call);
  if (!event) return <p className="qs-wait" role="status">
    {hasRecordedCall ? 'Waiting for output…' : 'This run has no recorded command output.'}
  </p>;
  const stdout = typeof event.result?.stdout === 'string' ? event.result.stdout.trimEnd() : '';
  const stderr = event.error?.message ?? event.result?.stderr;
  const failed = Boolean(event.error) || (typeof event.result?.exitCode === 'number' && event.result.exitCode !== 0);
  const columns = output.columns;
  const rows = columns?.length && tableRows(stdout, columns.length);
  return <section className="qs-command-result" aria-label={output.title}>
    {rows && columns ? <table><caption>{output.title}</caption>
      <thead><tr>{columns.map((column, index) => <th scope="col" key={index}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i} data-numeric={typeof cell === 'number' || undefined}>{cell}</td>)}</tr>)}</tbody>
    </table> : <><h4>{output.title}</h4>{stdout && <pre>{stdout}</pre>}</>}
    {stderr && <pre className={failed ? "qs-error" : undefined}>{String(stderr)}</pre>}
    {!stdout && !stderr && <p>No standard output.</p>}
  </section>;
}

export default function ExampleResult({ idea, events, t }: { idea: Idea; events: Ev[]; t: number }) {
  const calls = completed(events, t), out = printed(events, t);
  if (idea.output) return <RecordedOutput output={idea.output} calls={calls}
    hasRecordedCall={events.some(event => event.kind === 'call' && event.label === idea.output?.call)} />;
  if (idea.view === 'spend') return <div className="qs-result qs-spend" dangerouslySetInnerHTML={{ __html: idea.figure ?? '' }} />;
  if (idea.view === 'timeline') return <div className="qs-result qs-timeline"><Timeline idea={idea} events={events} t={t} /></div>;
  if (idea.view === 'page') {
    const fetch = calls.find(e => e.name === 'fetch'), preview = calls.find(e => e.result?.previewId);
    const body = String(fetch?.result.body ?? out.find(s => /^\d{3} /.test(s))?.replace(/^\d{3} /, '') ?? '');
    // Recorded HTML is displayed as text content, never executed in the marketing origin.
    const heading = body.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1];
    return <div className="qs-result qs-browser"><div className="qs-url"><span><Lock aria-hidden="true" />{String(preview?.result.url ?? '').replace(/^https:\/\//, '')}</span><b>{fetch?.result.status}</b></div><div className="qs-page">{heading ? <h1>{heading}</h1> : body}</div></div>;
  }
  if (idea.view === 'scoreboard') {
    const rows = scoreRows([...calls, ...events.filter(e => e.kind === 'stdout' && e.atMs <= t)], idea.code), max = Math.max(1, ...rows.flatMap(r => r.times));
    return <div className="qs-result qs-scoreboard"><div className="qs-score-row qs-score-head"><span>coding agent</span>{rows[0]?.scenarios.map(s => <span key={s}>{s}</span>)}<span>mean</span></div>{rows.map(row => <div className="qs-score-row" key={row.name}><b>{row.name}</b>{row.scenarios.map((s, i) => <span key={s} className="qs-score-cell">{row.aggregates.byScenario[s].meanComposite === 1 ? '✓' : '✗'} <i>{seconds(row.times[i])}</i><em><u style={{ width: `${row.times[i] / max * 100}%` }} /></em></span>)}<span>{row.aggregates.byJudge.suite.mean.toFixed(1)}</span></div>)}<p>{idea.code.match(/model:\s*\{\s*model:\s*"([^"]+)"/)?.[1]} for both · length of the agent's turn</p></div>;
  }
  if (idea.view === 'tree') {
    const parent = calls.find(e => e.name === 'create')?.result.id ?? '', branch = calls.find(e => e.name === 'branch');
    const kids = out.map(s => ({ id: s.match(/^(\S+) \[/)?.[1], lines: [...s.matchAll(/'([^']*)'/g)].map(m => m[1]) })).filter(k => k.id);
    const file = idea.code.match(/(?:writeFile|write)\("([^"]+)"/)?.[1] ?? idea.code.match(/echo .*? > ([\w.]+)/)?.[1];
    const card = (id: string, lines: string[]) => <div className="qs-tree-card"><div>{id}</div><section><span>{file}</span>{lines.map((line, i) => <p key={i} data-new={i > 0 || undefined}>{line}</p>)}</section></div>;
    return <div className="qs-result qs-tree"><div className="qs-tree-root">{card(parent, kids[0]?.lines.slice(0, 1) ?? [])}</div><div className="qs-fork"><span>branch({kids.length})</span><i>{seconds(branch?.durationMs)}</i></div><div className="qs-kids">{kids.map(k => <div key={k.id}>{card(`…${k.id!.slice(parent.length)}`, k.lines)}</div>)}</div></div>;
  }
  if (idea.view === 'states') {
    const write = calls.find(e => e.name === 'exec'), read = calls.filter(e => e.name === 'exec').at(-1);
    const file = idea.code.match(/> ([\w.]+)/)?.[1], value = write?.result.stdout || idea.code.match(/echo ['"]([^'"]+)['"]/)?.[1];
    const rows = calls.filter(e => ['create', 'exec', 'stop', 'resume'].includes(e.name ?? '')).map(e => ({ event: e, label: e.name === 'create' || e.name === 'resume' ? 'running' : e.name === 'stop' ? 'stopped' : e === write ? 'write' : 'read', text: e.name === 'create' ? e.result.id : e.name === 'stop' ? idea.stopped ?? '' : e.name === 'resume' ? idea.resumed ?? '' : e === write ? `${file} ← "${value}"` : `cat ${file} → ${String(read?.result.stdout ?? '').trim()}` }));
    return <div className="qs-result qs-states">{rows.map((r, i) => <div className="qs-state-row" data-state={r.label} key={i}><i /><b>{r.label}</b><span>{r.text}</span><small>{seconds(r.event.durationMs)}</small></div>)}</div>;
  }
  // Egress has no recorded run yet. It renders no invented outcome.
  if (idea.view === 'egress') return null;
  return <GenericResult events={events} t={t} />;
}
