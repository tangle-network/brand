import { Frame } from './frame';
import { CommandCopy } from './install-row';

export interface BillingProofProps {
  title: string;
  commands: string[];
  rows: { credential: string; billedTo: string }[];
  foot: string;
}

export function BillingProof({ title, commands, rows, foot }: BillingProofProps) {
  return <Frame left={<><span className="mk-path">{title}</span><CommandCopy label="Copy commands" text={commands.filter(command => !command.startsWith('#')).join('\n')} /></>}>
    <div className="mk-proof"><div className="mk-commands">{commands.map((command, index) => <div key={index} className={command.startsWith('#') ? 'mk-comment' : undefined}>{!command.startsWith('#') && <span className="mk-prompt">$ </span>}{command}</div>)}</div><table className="mk-billing"><thead><tr><th>Credential</th><th>Model usage is billed to</th></tr></thead><tbody>{rows.map(row => <tr key={row.credential}><td>{row.credential}</td><td>{row.billedTo}</td></tr>)}</tbody></table></div><div className="mk-proof-foot">{foot}</div>
  </Frame>;
}
