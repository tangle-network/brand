import { useEffect, useId, useRef, useState } from 'react';
import { TangleKnot } from '@tangle-network/brand';
import { Menu, X } from 'lucide-react';
import { Button } from '../primitives/button';

export interface SiteLink { label: string; href: string }
/** Brand icons are not included in Lucide. Shared by the two site landmarks. */
export function GithubMark() {
  return <svg className="mk-github-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" /></svg>;
}
export interface SiteNavProps {
  product?: string;
  links: SiteLink[];
  signIn: SiteLink;
  primary: SiteLink;
  github: string;
}

export function SiteNav({ product, links, signIn, primary, github }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const id = useId(), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [open]);
  return <header className={`mk mk-nav${product ? ' mk-has-product' : ''}`}>
    <div className="mk-wrap">
      <a className="mk-brand" href="/" aria-label="Tangle"><TangleKnot size={26} /><span>Tangle</span>{product && <span className="mk-product">{product}</span>}</a>
      <nav className="mk-nav-links" aria-label="Main">{links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
      <div className="mk-nav-right">
        <a className="mk-hide-phone mk-github" href={github} aria-label="GitHub"><GithubMark /></a>
        <a className="mk-hide-phone" href={signIn.href}>{signIn.label}</a>
        <Button asChild className="mk-btn mk-primary mk-small"><a href={primary.href}>{primary.label}</a></Button>
        <Button ref={trigger} variant="bare" className="mk-menu" aria-label="Menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</Button>
      </div>
    </div>
    {open && <nav id={id} className="mk-phone-nav" aria-label="Mobile">{[...links, signIn].map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}<a href={github}>GitHub</a></nav>}
  </header>;
}
