import { Button } from '../primitives/button';
import { Frame } from './frame';
import { CopyButton } from '../markdown/code-block';

export interface InstallCloserProps {
  heading: string;
  file: { path: string; source: string };
  line: number;
  before: string;
  after: string;
  commands: string[];
  actions: { label: string; href?: string; copy?: string }[];
}

export function InstallCloser({
  heading,
  file,
  line,
  before,
  after,
  commands,
  actions,
}: InstallCloserProps) {
  return (
    <section className="mk mk-section mk-last">
      <div className="mk-wrap mk-closer">
        <div className="mk-heading">
          <h2>{heading}</h2>
          <div className="mk-actions">
            {actions.map((action) =>
              action.href ? (
                <Button key={action.label} asChild className="mk-btn mk-primary">
                  <a href={action.href}>{action.label}</a>
                </Button>
              ) : (
                <CopyButton
                  key={action.label}
                  text={action.copy ?? file.source}
                  label={action.label}
                  className="mk-btn mk-ghost"
                  data-marketing-copy={action.copy ?? file.source}
                />
              ),
            )}
          </div>
        </div>
        <Frame
          left={
            <>
              <span className="mk-path">{file.path}</span>
              <span className="mk-line">line {line}</span>
              <CopyButton aria-label="Copy commands" className="mk-copy" text={commands.join('\n')} data-marketing-copy={commands.join('\n')} />
            </>
          }
        >
          <pre className="mk-closer-code">
            <span className="mk-deleted">-{before}</span>
            <span className="mk-added">+{after}</span>
            {'\n'}
            {commands.map((command) => (
              <span key={command}>
                <span className="mk-prompt">$ </span>
                {command}
                {'\n'}
              </span>
            ))}
          </pre>
        </Frame>
      </div>
    </section>
  );
}
