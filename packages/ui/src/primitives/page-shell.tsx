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
   * 13rem column of rows when its frame is at least 60rem wide, and a sticky
   * 56px tab strip under the header below that; the current link
   * (`aria-current="page"`) is centred by scrolling the strip only. Put
   * links (or a list of links) in `navigation`; an `svg` in a link shows only
   * in the column, and an element with `data-count` sits at its end.
   */
  measure?: "reading" | "settings";
  navigationLabel?: string;
  outlineLabel?: string;
  className?: string;
}

/**
 * Centre the current link of a horizontally scrolling nav, so the links on
 * both sides show that the strip scrolls. It moves the strip, never the page.
 */
function useCurrentLinkInView(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  React.useEffect(() => {
    const nav = ref.current;
    if (!enabled || !nav) return;
    const reveal = () => {
      if (nav.scrollWidth <= nav.clientWidth) return;
      const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current) return;
      const strip = nav.getBoundingClientRect();
      const link = current.getBoundingClientRect();
      nav.scrollLeft += link.left + link.width / 2 - (strip.left + strip.width / 2);
    };
    let live = true;
    reveal();
    // A web font swap widens the tabs without resizing the strip, so the
    // resize observer alone would leave the current tab where it was.
    void document.fonts?.ready.then(() => { if (live) reveal(); });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(reveal);
    resize?.observe(nav);
    // Links that a caller replaces (sections loaded later, a count that
    // changes) move the current tab as surely as a new aria-current does.
    const links = new MutationObserver(reveal);
    links.observe(nav, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-current"] });
    return () => {
      live = false;
      resize?.disconnect();
      links.disconnect();
    };
  }, [ref, enabled]);
}

/**
 * Ported from sandbox-ui/src/primitives/page-shell.tsx. An optional bounded
 * width, gutter and vertical rhythm, not an application shell or a card grid.
 * The caller owns landmarks, routing, auth, navigation and data state.
 * Without slots, className overrides the bound/gutters, or omit it for a
 * workbench layout. With slots it goes on the reading grid. With
 * `measure="settings"` it goes on the frame, the width the layout answers to,
 * so a `max-w-*` there bounds the measure and a narrow frame gets the strip.
 */
export function PageShell({ children, className, navigation, article, outline, header, measure = "reading", navigationLabel = "Sections", outlineLabel = "On this page" }: PageShellProps) {
  const navRef = React.useRef<HTMLElement>(null);
  const settings = measure === "settings";
  useCurrentLinkInView(navRef, settings && Boolean(navigation));
  if (navigation || article || outline || header || settings) {
    const shell = <div className={cn("tangle-reading-shell", !settings && className)} data-measure={settings ? "settings" : undefined}>
      {header && <div className="tangle-reading-header">{header}</div>}
      {navigation && <nav ref={navRef} aria-label={navigationLabel} className="tangle-reading-nav">{navigation}</nav>}
      <article className="tangle-reading-article">{article ?? children}</article>
      {outline && <aside aria-label={outlineLabel} className="tangle-reading-outline">{outline}</aside>}
    </div>;
    // The frame is the width container the settings layout answers to, so the
    // navigation switches on the content area's width, not the viewport's.
    return settings ? <div className={cn("tangle-settings-frame", className)}>{shell}</div> : shell;
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
