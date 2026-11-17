import { Frame } from './frame';
import { CodeBlock, CopyButton } from '../markdown/code-block';

export interface BillingProofProps {
  title: string;
  commands: string[];
  rows: { credential: string; billedTo: string }[];
  foot: string;
}

export function BillingProof({ title, commands, rows, foot }: BillingProofProps) {
  const copyText = commands.filter(command => !command.startsWith('#')).join('\n');
  return (
    <Frame
      left={
        <>
          <span className="mk-path"><b>{title}</b></span>
          <CopyButton
            aria-label="Copy commands"
            className="mk-copy"
            text={copyText}
            data-marketing-copy={copyText}
          />
        </>
      }
    >
      <div className="mk-proof">
        <div className="mk-commands">
          {commands.map((command, index) => (
            <CodeBlock
              key={index}
              language="bash"
              label=""
              className={`mk-command-block${command.startsWith('#') ? ' mk-comment' : ''}`}
              code={command.startsWith('#') ? command : `$ ${command}`}
            />
          ))}
        </div>
        <table className="mk-billing">
          <thead>
            <tr>
              <th>Credential</th>
              <th>Model usage is billed to</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.credential}>
                <td>{row.credential}</td>
                <td>{row.billedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mk-proof-foot">{foot}</div>
    </Frame>
  );
}
