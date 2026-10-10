"use client"

declare const process: { env: { NODE_ENV?: string } } | undefined

import * as React from "react"
import { touchTarget } from "../lib/control-presentation"
import { focusRing, focusRingInset } from "../lib/focus"
import { cn } from "../lib/utils"

/**
 * Visually lightweight segmented control for single-value selection.
 *
 * Uses role="radiogroup" / role="radio" because this is a value-selector
 * with no associated panels — not a tab interface. Arrow keys navigate
 * between options (with wrapping), Home/End jump to first/last.
 *
 * **Accessibility:** Provide either `aria-label` or `aria-labelledby` — the
 * ARIA spec requires every radiogroup to have an accessible name. A dev-mode
 * console warning fires when both are omitted.
 *
 * Design rules baked into the default variant:
 *   - Only the SELECTED segment shows a surface colour + accent text.
 *   - Unselected segments have NO background — they're plain-text labels
 *     that darken on hover. This keeps the selected segment as the
 *     single visual anchor instead of the whole group competing with
 *     itself.
 *   - Every label keeps one weight. Selection is colour plus surface or
 *     underline, so changing the value never reflows the row.
 *
 * The tabs variant scrolls sideways when its options outgrow the row: the
 * selected tab is kept in view, and a faded edge shows that more tabs sit
 * past it.
 */
export interface SegmentedControlOption<T extends string = string> {
  value: T
  label: React.ReactNode
  /** Rendered right of the label, typically a count or status pill. */
  adornment?: React.ReactNode
  /** Rendered as the option button's `data-testid`, for end-to-end selectors. */
  testId?: string
}

export interface SegmentedControlProps<T extends string = string>
  extends Pick<React.HTMLAttributes<HTMLDivElement>, "id" | "className" | "aria-label" | "aria-labelledby"> {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedControlOption<T>[]
  /**
   * Layout:
   *   - "row"   — horizontal pill bar (default, fits in a header region)
   *   - "tabs"  — horizontal with a bottom border so the selected pill
   *              reads as a classic tab (used on the Team page)
   */
  variant?: "row" | "tabs"
  /** Rendered as the group's `data-testid`. */
  "data-testid"?: string
}

/** Width of the faded edge that marks more tabs past the strip, in px. */
const TAB_EDGE_FADE = 24
// Fade whichever edge has tabs past it; the two-attribute rule wins on specificity.
const tabEdgeFade = [
  "data-[overflow-start]:[mask-image:linear-gradient(to_right,transparent,#000_24px)]",
  "data-[overflow-end]:[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]",
  "data-[overflow-start]:data-[overflow-end]:[mask-image:linear-gradient(to_right,transparent,#000_24px,#000_calc(100%-24px),transparent)]",
]

export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  variant = "row",
  className,
  ...rest
}: SegmentedControlProps<T>) {
  if (
    typeof process !== "undefined" &&
    process?.env?.NODE_ENV !== "production" &&
    !rest["aria-label"] &&
    !rest["aria-labelledby"]
  ) {
    console.warn(
      '[SegmentedControl] role="radiogroup" requires either aria-label or aria-labelledby for accessibility.',
    )
  }

  const optionRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map())
  const stripRef = React.useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = React.useState({ start: false, end: false })
  const tabs = variant === "tabs"

  const measureOverflow = React.useCallback(() => {
    const strip = stripRef.current
    if (!strip) return
    const start = strip.scrollLeft > 1
    const end = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1
    setOverflow((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])

  // Keep the selected tab inside the strip. Only the strip scrolls: the page
  // never moves, which scrollIntoView cannot promise.
  React.useLayoutEffect(() => {
    if (!tabs) return
    const strip = stripRef.current
    const option = optionRefs.current.get(value)
    if (strip && option) {
      const start = option.offsetLeft
      const end = start + option.offsetWidth
      if (start < strip.scrollLeft + TAB_EDGE_FADE) {
        strip.scrollLeft = Math.max(0, start - TAB_EDGE_FADE)
      } else if (end > strip.scrollLeft + strip.clientWidth - TAB_EDGE_FADE) {
        strip.scrollLeft = end - strip.clientWidth + TAB_EDGE_FADE
      }
    }
    measureOverflow()
  }, [tabs, value, options.length, measureOverflow])

  React.useEffect(() => {
    if (!tabs || typeof ResizeObserver === "undefined") return
    const strip = stripRef.current
    if (!strip) return
    const observer = new ResizeObserver(measureOverflow)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [tabs, measureOverflow])

  const hasMatch = options.some((o) => o.value === value)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (options.length === 0) return
    // When no option matches value, start navigation from the first option
    let idx = options.findIndex((o) => o.value === value)
    if (idx === -1) idx = 0
    let next: number | undefined
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % options.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + options.length) % options.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = options.length - 1
    if (next !== undefined) {
      e.preventDefault()
      if (options[next].value !== value) {
        onValueChange(options[next].value)
      }
      optionRefs.current.get(options[next].value)?.focus()
    }
  }

  return (
    <div
      role="radiogroup"
      id={rest.id}
      aria-label={rest["aria-label"]}
      aria-labelledby={rest["aria-labelledby"]}
      data-testid={rest["data-testid"]}
      data-overflow-start={overflow.start || undefined}
      data-overflow-end={overflow.end || undefined}
      ref={stripRef}
      onKeyDown={handleKeyDown}
      onScroll={tabs ? measureOverflow : undefined}
      className={cn(
        "flex gap-1",
        variant === "row" &&
          "flex-wrap items-center rounded-lg border border-border bg-card p-1",
        variant === "tabs" &&
          ["relative flex-nowrap items-end border-b border-border pb-0 overflow-x-auto", tabEdgeFade],
        className,
      )}
    >
      {options.map((option, i) => {
        const active = option.value === value
        const focusable = active || (!hasMatch && i === 0)
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (el) optionRefs.current.set(option.value, el)
              else optionRefs.current.delete(option.value)
            }}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={option.testId}
            tabIndex={focusable ? 0 : -1}
            onClick={() => {
              if (!active) onValueChange(option.value)
            }}
            className={cn(
              "relative inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,box-shadow]",
              variant === "row" && ["rounded-md px-3 py-1.5", focusRing],
              // The strip scrolls horizontally, which would clip an outer ring.
              variant === "tabs" && ["shrink-0 rounded-none border-b-2 -mb-px px-4 py-2", touchTarget, focusRingInset],
              // Active styling is the ONLY styled state — unselected
              // segments stay transparent on purpose so they don't
              // compete visually with the selection.
              active
                ? variant === "row"
                  ? "border border-transparent bg-[var(--accent-surface)] text-[var(--accent-text)]"
                  : "border-[var(--accent-text)] text-[var(--accent-text)]"
                : variant === "row"
                  ? "border border-transparent text-muted-foreground hover:text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{option.label}</span>
            {option.adornment && (
              <span
                className={cn(
                  "text-xs",
                  active ? "text-[var(--accent-text)]/80" : "text-muted-foreground",
                )}
              >
                {option.adornment}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
