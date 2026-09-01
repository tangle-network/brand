import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { cn } from "../lib/utils";

const CLASS_NAME = "tangle-text-shimmer";
const STYLE_ID = "tangle-text-shimmer-styles";

/**
 * The sweep is a MASK over the text's own colour, not a gradient background
 * clipped to the glyphs: if this stylesheet is missing the text still renders
 * in its normal colour instead of disappearing (`color: transparent`).
 *
 * Mask geometry mirrors the background variant: a 250%-wide tile whose bright
 * band sits at 45–60%, slid from 150% to -50% so one band crosses the text per
 * cycle. The tile repeats, so the .72 floor covers every glyph at every frame —
 * the label reads at ~72% foreground opacity with a brighter sweep through it.
 */
const SHIMMER_CSS = `
@keyframes ${CLASS_NAME} {
  from { -webkit-mask-position: 150% center; mask-position: 150% center; }
  to { -webkit-mask-position: -50% center; mask-position: -50% center; }
}
.${CLASS_NAME} {
  -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,0.72) 0%, #000 45%, rgba(0,0,0,0.72) 60%);
  mask-image: linear-gradient(90deg, rgba(0,0,0,0.72) 0%, #000 45%, rgba(0,0,0,0.72) 60%);
  -webkit-mask-size: 250% 100%;
  mask-size: 250% 100%;
  animation: ${CLASS_NAME} 1.4s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .${CLASS_NAME} {
    animation: none;
    -webkit-mask-image: none;
    mask-image: none;
    text-decoration: underline dotted currentColor;
    text-underline-offset: 3px;
  }
}
`;

/** Inject the shimmer stylesheet once per document. A no-op on the server. */
function ensureShimmerStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = SHIMMER_CSS;
  document.head.appendChild(style);
}

// Layout effect so the mask is in place before the first paint; effect on the
// server, where there is no layout phase.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface TextShimmerProps {
  children: ReactNode;
  className?: string;
  /** One sweep across the text, in milliseconds. */
  durationMs?: number;
}

/**
 * Inline text with a gradient-mask sweep — the in-flight signal for a run row
 * label ("Thinking…", a tool verb while its call is running). Carries the
 * styles it needs, so a consumer that only scans this package for Tailwind
 * classes still gets the animation.
 */
export function TextShimmer({
  children,
  className,
  durationMs = 1400,
}: TextShimmerProps) {
  useIsomorphicLayoutEffect(ensureShimmerStyles, []);
  return (
    <span
      className={cn(CLASS_NAME, "text-foreground", className)}
      style={{ animationDuration: `${durationMs}ms` }}
    >
      {children}
    </span>
  );
}
