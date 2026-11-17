import type { ReactNode } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';

export function Frame({
  left,
  right,
  receipt,
  children,
}: {
  left: ReactNode;
  right?: ReactNode;
  receipt?: { ok: boolean; parts: string[]; action?: ReactNode };
  children?: ReactNode;
}) {
  return (
    <div className="mk mk-frame">
      <div className="mk-chrome">
        <div className="mk-chrome-left">{left}</div>
        {right && <div className="mk-chrome-right">{right}</div>}
      </div>
      {children}
      {receipt && (
        <div className={`mk-receipt${receipt.ok ? '' : ' mk-refused'}`}>
          <span className="mk-receipt-lead">
            {receipt.ok ? <CircleCheck size={17} /> : <CircleX size={17} />}
            {receipt.parts[0]}
          </span>
          {receipt.parts.slice(1).map((part, index) => (
            <span key={index}>· {part}</span>
          ))}
          {receipt.action}
        </div>
      )}
    </div>
  );
}
