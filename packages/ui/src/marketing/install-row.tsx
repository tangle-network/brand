import { CopyButton } from '../markdown/code-block';

export function InstallRow({ command }: { command: string }) {
  return (
    <div className="mk mk-install">
      <code>
        <span className="mk-prompt">$ </span>
        {command}
      </code>
      <CopyButton text={command} aria-label="Copy command" className="mk-copy" data-marketing-copy={command} />
    </div>
  );
}
