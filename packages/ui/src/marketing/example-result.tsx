import { Markdown } from '../markdown/markdown';
import { useMemo } from 'react';
import type { Ev } from './run-replay';

/** What the run has produced by recorded time `t`: printed output, test results, the patch, scores and each fleet agent's answer. The timeline beside it shows the work. */
export default function ExampleResult({ events, t }: { events: Ev[]; t: number }) {
  const result = useMemo(() => {
    const calls = events.filter((event) => event.kind === 'call' && event.atMs + (event.durationMs ?? 0) <= t);
    const outputs = calls.filter((event) => typeof event.result?.stdout === 'string' && event.result.stdout.trim());
    const patch = outputs.findLast((event) => event.result.stdout.startsWith('diff --git '))?.result.stdout as string | undefined;
    const tests = outputs.findLast((event) => /^# tests \d/m.test(event.result.stdout))?.result.stdout as string | undefined;
    const pass = tests?.match(/^# pass (\d+)/m)?.[1], fail = tests?.match(/^# fail (\d+)/m)?.[1];
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
    return { patch, tests, pass, fail, answers, assessments, errors, consoleText: consoleOutput,
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
          <p className="qs-test-result" role="status">{result.fail === '0' ? `${result.pass} tests passed` : `${result.fail} tests failed`}</p>
          {result.patch && <>
            <pre className="qs-diff">{result.patch.split('\n').filter((line) => !/^(?:index |--- |\+\+\+ )/.test(line)).map((line, index) => {
              const file = line.match(/^diff --git a\/(\S+)/)?.[1];
              return <span key={index} data-line={file ? 'file' : line.startsWith('@@') ? 'hunk' : line[0] === '+' ? 'add' : line[0] === '-' ? 'del' : undefined}>{file ?? line}{'\n'}</span>;
            })}</pre>
            <a className="qs-patch" download="fix.patch" href={`data:text/plain;charset=utf-8,${encodeURIComponent(result.patch)}`}>Download patch</a>
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
