import { useEffect, useId, useRef, useState } from 'react';
import { TangleKnot } from '@tangle-network/brand';
import { Github, Menu, X } from 'lucide-react';
import { Button } from '../primitives/button';

export interface SiteLink { label: string; href: string }
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
        <a className="mk-hide-phone mk-github" href={github} aria-label="GitHub"><Github size={20} /></a>
        <a className="mk-hide-phone" href={signIn.href}>{signIn.label}</a>
        <Button asChild className="mk-btn mk-primary mk-small"><a href={primary.href}>{primary.label}</a></Button>
        <Button ref={trigger} variant="bare" className="mk-menu" aria-label="Menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</Button>
      </div>
    </div>
    {open && <nav id={id} className="mk-phone-nav" aria-label="Mobile">{[...links, signIn].map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}<a href={github}>GitHub</a></nav>}
  </header>;
}
