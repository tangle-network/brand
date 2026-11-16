import type { SiteLink } from './site-nav';

/** figureHtml is trusted output from charts.renderFigure, never user HTML. */
export function LatencyPanel({
  figureHtml,
  source,
  more,
}: {
  figureHtml: string;
  source: string;
  more: SiteLink;
}) {
  return (
    <div className="mk mk-latency">
      <div className="mk-latency-figure" dangerouslySetInnerHTML={{ __html: figureHtml }} />
      <div className="mk-source">
        <span>{source}</span>
        <a href={more.href}>{more.label}</a>
      </div>
    </div>
  );
}
