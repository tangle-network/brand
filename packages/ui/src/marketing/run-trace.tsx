import { CircleCheck } from 'lucide-react';
import { clock, seconds, diffStats, type Ev, type RunMeta } from './run-replay';

export interface RunTraceProps {
  run: RunMeta;
  events: Ev[];
  task: string;
  repo: string;
  backend: string;
}

export function RunTrace({ run, events, task, repo, backend }: RunTraceProps) {
  const calls = events.filter((event) => event.kind === 'call');
  const create = calls.find((event) => event.label === 'client.create');
  const test = calls.find(
    (event) => typeof event.result?.stdout === 'string' && /^# pass /m.test(event.result.stdout),
  );
  const diff = calls.find((event) => event.result?.stdout?.startsWith('diff --git '))?.result
    .stdout as string | undefined;
  const stats = diffStats(diff ?? '');
  const repoDirectory = repo.split('/').at(-1) ?? '';
  const tools = events.flatMap((event) =>
    event.kind === 'stream' &&
    event.data?.part?.type === 'tool' &&
    event.data.part.state?.status === 'completed'
      ? [event.data.part]
      : [],
  );
  const fail = tools
    .flatMap((tool) => String(tool.state.output ?? '').split('\n'))
    .find((line) => line.startsWith('not ok'));
  const edits = [
    ...new Set<string>(
      tools
        .filter((tool) => tool.tool === 'Edit')
        .map((tool) => String(tool.state.input.file_path).split(`${repoDirectory}/`).at(-1)!),
    ),
  ];
  const passed = String(test?.result?.stdout ?? '').match(/^# pass (\d+)/m)?.[1];
  const failed = String(test?.result?.stdout ?? '').match(/^# fail (\d+)/m)?.[1];
  const usage = events
    .filter((event) => event.kind === 'stdout')
    .map((event) => event.text ?? '')
    .join('\n');
  const tokens = (field: string) =>
    Number(usage.match(new RegExp(`${field}: (\\d+)`))?.[1] ?? 0).toLocaleString('en-US');
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(run.recordedAt));
  const file = run.url
    .split('/')
    .pop()
    ?.replace(/\.json$/, '.mts');
  return (
    <div className="mk mk-trace" aria-label="One recorded run, from your code to the result">
      <div className="mk-trace-card">
        <div className="mk-trace-title">
          <span>Your code</span>
          <span>{file}</span>
        </div>
        <div className="mk-trace-body">
          <div className="mk-task">
            “
            {task
              .split(/(`[^`]+`)/)
              .map((part, index) =>
                part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part,
              )}
            ”
          </div>
          <div className="mk-task-meta">
            <span>
              backend <b>{backend}</b>
            </span>
            <span>
              git <b>{repo}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="mk-arrow">
        <span>create</span>
        <em>{seconds(create?.durationMs)}</em>
      </div>
      <div className="mk-zone">
        <span className="mk-zone-label">Tangle</span>
        <div className="mk-trace-card">
          <div className="mk-trace-title">
            <span>Sandbox</span>
            <span>{run.runId}</span>
          </div>
          <div className="mk-trace-body mk-trace-tools">
            <div>
              <span>Bash</span>
              <code>npm test</code>
            </div>
            <div>
              <span />
              <code className="mk-bad">{fail}</code>
            </div>
            {edits.map((file) => (
              <div key={file}>
                <span>Edit</span>
                <code>{file}</code>
              </div>
            ))}
            <div>
              <span>Bash</span>
              <code>
                npm test{' '}
                <b className="mk-good">
                  {' '}
                  # pass {passed} # fail {failed}
                </b>
              </code>
            </div>
          </div>
        </div>
        <div className="mk-router">
          <div>
            <b>Tangle Router</b>
            <i>${run.costUsd?.toFixed(4)}</i>
          </div>
          <span>
            <i>{tokens('inputTokens')}</i> tokens in + <i>{tokens('cacheReadTokens')}</i> from cache
            · <i>{tokens('outputTokens')}</i> out
          </span>
        </div>
      </div>
      <div className="mk-arrow">
        <span>exec</span>
        <em>{seconds(test?.durationMs)}</em>
      </div>
      <div className="mk-trace-card mk-back">
        <div className="mk-trace-title">
          <span>Back to you</span>
          <span>{date}</span>
        </div>
        <div className="mk-trace-body">
          <div className="mk-result">
            <CircleCheck size={17} />
            {passed} tests passed
          </div>
          <div className="mk-file-stats">
            {stats.map((stat) => (
              <div key={stat.name}>
                <span>{stat.name.split('/').pop()}</span>
                <span>
                  <b>+{stat.add}</b>
                  <s>−{stat.del}</s>
                </span>
              </div>
            ))}
          </div>
          <div className="mk-clock">
            <strong>
              {clock(run.ms)}
            </strong>
            <span>
              from create
              <br />
              to delete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
