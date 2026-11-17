import type { ReactNode } from 'react';
import type { SiteLink } from './site-nav';

export interface SectionProps {
  id: string;
  heading: string;
  sub?: string;
  level?: 1 | 2;
  link?: SiteLink;
  align?: 'start' | 'center';
  glow?: boolean;
  layout?: 'stack' | 'split';
  children?: ReactNode;
}

export function Section({
  id,
  heading,
  sub,
  level = 2,
  link,
  align = 'start',
  glow,
  layout = 'stack',
  children,
}: SectionProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <section
      id={id}
      className={`mk mk-section${level === 1 ? ' mk-hero' : ''}${glow ? ' mk-glow' : ''}${align === 'center' ? ' mk-center' : ''}${layout === 'split' ? ' mk-split' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <div className="mk-wrap">
        <header className="mk-heading">
          <div>
            <Heading id={`${id}-title`}>{heading}</Heading>
            {sub && (
              <p>
                {sub
                  .split(/(`[^`]+`)/)
                  .map((part, index) =>
                    part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part,
                  )}
              </p>
            )}
          </div>
          {link && (
            <a className="mk-section-link" href={link.href}>
              {link.label}
            </a>
          )}
        </header>
        {children}
      </div>
    </section>
  );
}
