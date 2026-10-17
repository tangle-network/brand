"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface PageShellProps {
  children?: ReactNode;
  /** Optional reading layout. Content, routing and navigation interaction stay caller-owned. */
  navigation?: ReactNode;
  article?: ReactNode;
  outline?: ReactNode;
  /** Spans the reading layout above navigation and article, such as the page's `PageHeader`. */
  header?: ReactNode;
  /**
   * The reading layout's measure. `reading` (default) is the 42rem document
   * column. `settings` is a 48rem column of cards whose navigation is a sticky
   * 13rem column of rows when the shell's own width is at least 60rem, and a
   * sticky 56px tab strip under the header below that; the current link
   * (`aria-current="page"`) is kept in view by scrolling the strip only. Put
   * links (or a list of links) in `navigation`; an `svg` in a link shows only
   * in the column, and an element with `data-count` sits at its end.
   */
  measure?: "reading" | "settings";
  navigationLabel?: string;
  outlineLabel?: string;
  className?: string;
}

/** Keep the current link of a horizontally scrolling nav in view, moving the strip and never the page. */
function useCurrentLinkInView(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  React.useEffect(() => {
    const nav = ref.current;
    if (!enabled || !nav) return;
    const reveal = () => {
      if (nav.scrollWidth <= nav.clientWidth) return;
      const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current) return;
      const inset = Number.parseFloat(getComputedStyle(nav).paddingInlineStart) || 0;
      const strip = nav.getBoundingClientRect();
      const link = current.getBoundingClientRect();
      if (link.left < strip.left + inset) nav.scrollLeft -= strip.left + inset - link.left;
      else if (link.right > strip.right - inset) nav.scrollLeft += link.right - (strip.right - inset);
    };
    reveal();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(reveal);
    resize?.observe(nav);
    const current = new MutationObserver(reveal);
    current.observe(nav, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
    return () => {
      resize?.disconnect();
      current.disconnect();
    };
  }, [ref, enabled]);
}

/**
 * Ported from sandbox-ui/src/primitives/page-shell.tsx. An optional bounded
 * width, gutter and vertical rhythm, not an application shell or a card grid.
 * The caller owns landmarks, routing, auth, navigation and data state. Use
 * className to override the bound/gutters, or omit it for a workbench layout.
 */
export function PageShell({ children, className, navigation, article, outline, header, measure = "reading", navigationLabel = "Sections", outlineLabel = "On this page" }: PageShellProps) {
  const navRef = React.useRef<HTMLElement>(null);
  const settings = measure === "settings";
  useCurrentLinkInView(navRef, settings && Boolean(navigation));
  if (navigation || article || outline || header) {
    const shell = <div className={cn("tangle-reading-shell", className)} data-measure={settings ? "settings" : undefined}>
      {header && <div className="tangle-reading-header">{header}</div>}
      {navigation && <nav ref={navRef} aria-label={navigationLabel} className="tangle-reading-nav">{navigation}</nav>}
      <article className="tangle-reading-article">{article ?? children}</article>
      {outline && <aside aria-label={outlineLabel} className="tangle-reading-outline">{outline}</aside>}
    </div>;
    // The frame is the width container the settings layout answers to, so the
    // navigation switches on the content area's width, not the viewport's.
    return settings ? <div className="tangle-settings-frame">{shell}</div> : shell;
  }
  return (
    <div
      className={cn(
        "mx-auto min-w-0 w-full max-w-6xl space-y-8 px-6 py-8 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
