import { useState } from 'react';
import { TerminalReplay } from './terminal-replay';

// A few `tangle` commands with their recorded output. Nothing runs here: sign-in opens the real flow.
export interface CliCommand { label: string; command: string; cast: string }
export interface CliPlaygroundProps {
  commands: CliCommand[];
  login: { command: string; href: string; note: string };
  title?: string;
}

export function CliPlayground({ commands, login, title = 'Recorded output' }: CliPlaygroundProps) {
  const [picked, setPicked] = useState(0);
  const current = commands[picked];
  return <div className="mk mk-cli">
    <div className="mk-chrome"><div className="mk-chrome-left"><span className="mk-path">{title}</span></div></div>
    <div className="mk-cli-body">
      <div className="mk-cli-list" role="group" aria-label="Commands">
        {commands.map((item, index) => <button key={item.cast} type="button" aria-pressed={index === picked} onClick={() => setPicked(index)}>
          <span>{item.label}</span>
          <code><i>$ </i>{item.command}</code>
        </button>)}
        <a className="mk-cli-login" href={login.href} data-track="cli-login">
          <code><i>$ </i>{login.command}</code>
          <span>{login.note}</span>
        </a>
      </div>
      {current && <TerminalReplay key={current.cast} src={current.cast} inputs={[current.command]} title={`${current.command}, recorded output`} />}
    </div>
  </div>;
}
