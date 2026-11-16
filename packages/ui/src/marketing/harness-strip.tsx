import type { ReactNode } from 'react';

export interface HarnessStripProps {
  harnesses: { id: string; name: string; logo: string }[];
  hrefTemplate: string;
  liveLabel: string;
  children?: ReactNode;
}

export function HarnessStrip({ harnesses, hrefTemplate, liveLabel, children }: HarnessStripProps) {
  return <div className="mk mk-harnesses">
    {children && <div className="mk-live-slot" aria-label={liveLabel}>{children}</div>}
    <div className="mk-harness-grid">{harnesses.map(harness => <a key={harness.id} className="mk-harness" href={hrefTemplate.replace('{id}', encodeURIComponent(harness.id))} aria-label={`Create a sandbox with ${harness.name}`}><img src={harness.logo} alt="" width={44} height={44} loading="lazy" /><b>{harness.name}</b><code>"{harness.id}"</code></a>)}</div>
  </div>;
}
