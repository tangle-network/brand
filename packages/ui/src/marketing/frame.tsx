import type { ReactNode } from 'react';

export function Frame({
  left,
  right,
  children,
}: {
  left: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mk mk-frame">
      <div className="mk-chrome">
        <div className="mk-chrome-left">{left}</div>
        {right && <div className="mk-chrome-right">{right}</div>}
      </div>
      {children}

    </div>
  );
}
