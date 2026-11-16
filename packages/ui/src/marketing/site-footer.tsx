import { TangleKnot } from '@tangle-network/brand';
import { Github } from 'lucide-react';
import { ComplianceBadge, type ComplianceProduct, type ComplianceStatus } from '../primitives/compliance-badge';
import type { SiteLink } from './site-nav';

export interface SiteFooterProps {
  status: { up: boolean; href: string };
  email: string;
  columns: { heading: string; links: SiteLink[] }[];
  legal: SiteLink[];
  badges: { product: ComplianceProduct; status: ComplianceStatus; href: string }[];
  github: string;
}

export function SiteFooter({ status, email, columns, legal, badges, github }: SiteFooterProps) {
  return <footer className="mk mk-footer"><div className="mk-wrap">
    <div className="mk-footer-top"><div>
      <a className="mk-brand" href="/"><TangleKnot size={26} />Tangle</a>
      <a className="mk-status" href={status.href}><i data-up={status.up} />{status.up ? 'All services operational' : 'Some services degraded'}</a>
      <a className="mk-mail" href={`mailto:${email}`}>{email}</a>
    </div>{columns.map(column => <nav key={column.heading} aria-label={column.heading}><h4>{column.heading}</h4><ul>{column.links.map(link => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul></nav>)}</div>
    <div className="mk-footer-bottom"><span>© {new Date().getUTCFullYear()} Tangle</span>{legal.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}<span className="mk-spacer" />{badges.map(badge => <ComplianceBadge key={badge.product} {...badge} />)}<a href={github} aria-label="GitHub"><Github size={20} /></a></div>
  </div></footer>;
}
