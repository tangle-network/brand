import { CircleCheck } from 'lucide-react';
import type { Ev, RunMeta } from './run-replay';

export interface RunTraceProps { run: RunMeta; events: Ev[]; task: string; repo: string; backend: string }
const duration = (ms = 0) => ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;

export function RunTrace({ run, events, task, repo, backend }: RunTraceProps) {
  const calls = events.filter(event => event.kind === 'call');
  const create = calls.find(event => event.label === 'client.create');
  const test = calls.find(event => typeof event.result?.stdout === 'string' && /^# pass /m.test(event.result.stdout));
  const diff = calls.find(event => event.result?.stdout?.startsWith('diff --git '))?.result.stdout as string | undefined;
  const stats: { file: string; added: number; deleted: number }[] = [];
  for (const line of (diff ?? '').split('\n')) {
    if (line.startsWith('diff --git ')) stats.push({ file: line.split(' b/')[1], added: 0, deleted: 0 });
    else if (stats.length && line.startsWith('+') && !line.startsWith('+++')) stats[stats.length - 1].added++;
    else if (stats.length && line.startsWith('-') && !line.startsWith('---')) stats[stats.length - 1].deleted++;
  }
  const tools = events.flatMap(event => event.kind === 'stream' && event.data?.part?.type === 'tool' && event.data.part.state?.status === 'completed' ? [event.data.part] : []);
  const fail = tools.flatMap(tool => String(tool.state.output ?? '').split('\n')).find(line => line.startsWith('not ok'));
  const edits = [...new Set<string>(tools.filter(tool => tool.tool === 'Edit').map(tool => String(tool.state.input.file_path).replace(/^.*?sandbox-demo\//, '')))];
  const passed = String(test?.result?.stdout ?? '').match(/^# pass (\d+)/m)?.[1];
  const failed = String(test?.result?.stdout ?? '').match(/^# fail (\d+)/m)?.[1];
  const usage = events.filter(event => event.kind === 'stdout').map(event => event.text ?? '').join('\n');
  const tokens = (field: string) => Number(usage.match(new RegExp(`${field}: (\\d+)`))?.[1] ?? 0).toLocaleString('en-US');
  const total = Math.floor(run.ms / 1000);
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(run.recordedAt));
  const file = run.url.split('/').pop()?.replace(/\.json$/, '.mts');
  return <div className="mk mk-trace" aria-label="One recorded run, from your code to the result">
    <div className="mk-trace-card"><div className="mk-trace-title"><span>Your code</span><span>{file}</span></div><div className="mk-trace-body"><div className="mk-task">“{task.split(/(`[^`]+`)/).map((part, index) => part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part)}”</div><div className="mk-task-meta"><span>backend <b>{backend}</b></span><span>git <b>{repo}</b></span></div></div></div>
    <div className="mk-arrow"><span>create</span><em>{duration(create?.durationMs)}</em></div>
    <div className="mk-zone"><span className="mk-zone-label">Tangle</span><div className="mk-trace-card"><div className="mk-trace-title"><span>Sandbox</span><span>{run.runId}</span></div><div className="mk-trace-body mk-trace-tools"><div><span>Bash</span><code>npm test</code></div><div><span /><code className="mk-bad">{fail}</code></div>{edits.map(file => <div key={file}><span>Edit</span><code>{file}</code></div>)}<div><span>Bash</span><code>npm test <b className="mk-good"> # pass {passed} # fail {failed}</b></code></div></div></div><div className="mk-router"><div><b>Tangle Router</b><i>${run.costUsd?.toFixed(4)}</i></div><span><i>{tokens('inputTokens')}</i> tokens in + <i>{tokens('cacheReadTokens')}</i> from cache · <i>{tokens('outputTokens')}</i> out</span></div></div>
    <div className="mk-arrow"><span>exec</span><em>{duration(test?.durationMs)}</em></div>
    <div className="mk-trace-card mk-back"><div className="mk-trace-title"><span>Back to you</span><span>{date}</span></div><div className="mk-trace-body"><div className="mk-result"><CircleCheck size={17} />{passed} tests passed</div><div className="mk-file-stats">{stats.map(stat => <div key={stat.file}><span>{stat.file.split('/').pop()}</span><span><b>+{stat.added}</b><s>−{stat.deleted}</s></span></div>)}</div><div className="mk-clock"><strong>{Math.floor(total / 60)}:{String(total % 60).padStart(2, '0')}</strong><span>from create<br />to delete</span></div></div></div>
  </div>;
}
