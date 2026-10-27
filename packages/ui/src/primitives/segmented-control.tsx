"use client"

declare const process: { env: { NODE_ENV?: string } } | undefined

import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"
import { touchTarget } from "../lib/control-presentation"
import { focusRing, focusRingInset } from "../lib/focus"
import { ixControlSoft, ixTabUnderline } from "../lib/interaction"
import { cn } from "../lib/utils"

/** The row variant's selected segment: a raised thumb on the well, not a tint inside a ring. */
const rowThumb =
  "aria-checked:bg-card aria-checked:border-border aria-checked:shadow-[0_1px_2px_rgb(0_0_0/0.08)] hover:aria-checked:bg-card"

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
 *   - The row track is one quiet well (`--well`, the hairline `border`), so
 *     the control reads as one inset group on whatever plane it sits on, and
 *     it is compact (36px) so it sits inside a 44px toolbar with air above
 *     and below instead of touching its edges.
 *   - Only the SELECTED segment shows a surface: a raised thumb (the card
 *     colour with a hairline and a soft shadow) with accent text. No ring is
 *     drawn around the track's segments, so the group never stacks rings. A tab
 *     shows it as an underline instead (`ixTabUnderline`).
 *   - Unselected segments have NO background — they're plain-text labels
 *     that darken on hover. This keeps the selected segment as the
 *     single visual anchor instead of the whole group competing with
 *     itself.
 *   - Every label keeps one weight. Selection is colour plus surface or
 *     underline, so changing the value never reflows the row.
 *
 * When the options outgrow the row they scroll sideways (the tabs variant
 * always can; the row variant can when a host gives it `flex-nowrap
 * overflow-x-auto`). A chevron button pinned to each edge with options past it
 * shows that the strip scrolls and pages it on click or tap; touch and
 * trackpad scroll it natively, and arrow keys move the selection, which is
 * kept fully in view clear of the chevrons.
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

/** Size of the edge chevron, in px. The selected option is kept this far
 *  (plus the strip's own padding) from an edge so the chevron never covers it. */
const SCROLL_CUE_SIZE = 32
/** The strip's flex gap (`gap-1`). A cue's negative margin cancels its width
 *  and this gap, so showing it never shifts the options: a shift is not a
 *  resize, so nothing would re-reveal the selected option afterwards. */
const STRIP_GAP = 4

/**
 * A chevron pinned to one edge of the scrolling strip. It is a sticky flex
 * item with a negative margin equal to its width plus the gap, so it takes no room in the
 * row (showing it never reflows the options) and stays at the visible edge
 * while the strip scrolls. A solid surface keeps it legible on any plane,
 * which an edge fade is not: a fade over the gap between two options, or over
 * a host's inline padding, shows nothing.
 */
function ScrollCue({ side, onPage }: { side: "start" | "end"; onPage: () => void }) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      // Pointer and touch affordance only: keyboard users move the selection
      // with the arrow keys, and the strip keeps it in view.
      tabIndex={-1}
      aria-hidden="true"
      data-scroll-cue={side}
      onClick={onPage}
      className={cn(
        "sticky z-[1] flex shrink-0 items-center justify-center self-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground",
        side === "start" ? "left-0" : "right-0",
      )}
      style={{
        width: SCROLL_CUE_SIZE,
        height: SCROLL_CUE_SIZE,
        [side === "start" ? "marginRight" : "marginLeft"]: -(SCROLL_CUE_SIZE + STRIP_GAP),
      }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

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
  // Re-observe when the option set changes, not on every render of a host
  // that builds its options array inline.
  const optionKey = options.map((o) => o.value).join("\u0000")

  const measureOverflow = React.useCallback(() => {
    const strip = stripRef.current
    if (!strip) return
    const start = strip.scrollLeft > 1
    const end = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1
    setOverflow((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])

  // Keep the selected option inside the strip and clear of the chevrons.
  // Only the strip scrolls: the page never moves, which scrollIntoView cannot
  // promise. A strip that does not overflow ignores the assignment.
  const valueRef = React.useRef(value)
  valueRef.current = value
  const revealSelected = React.useCallback(() => {
    const strip = stripRef.current
    const option = optionRefs.current.get(valueRef.current)
    if (strip && option && strip.scrollWidth > strip.clientWidth) {
      const style = getComputedStyle(strip)
      // offsetLeft/offsetWidth round to whole pixels while the tab is fractional (a 101.42 px tab overlapped the
      // chevron by 0.66 px at 390 px), so keep a small gap beside each cue rather than touching its edge.
      const gap = 4
      const reserveStart = SCROLL_CUE_SIZE + gap + (Number.parseFloat(style.paddingLeft) || 0)
      const reserveEnd = SCROLL_CUE_SIZE + gap + (Number.parseFloat(style.paddingRight) || 0)
      const start = option.offsetLeft
      const end = start + option.offsetWidth
      if (start - reserveStart < strip.scrollLeft) {
        strip.scrollLeft = Math.max(0, start - reserveStart)
      } else if (end + reserveEnd > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = end + reserveEnd - strip.clientWidth
      }
    }
    measureOverflow()
  }, [measureOverflow])

  React.useLayoutEffect(revealSelected, [value, options.length, revealSelected])

  // The strip's own size and its options' sizes (late web fonts, a changed
  // label or adornment) move both the selected option and the overflow edges.
  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") return
    const strip = stripRef.current
    if (!strip) return
    const observer = new ResizeObserver(revealSelected)
    observer.observe(strip)
    for (const option of optionRefs.current.values()) observer.observe(option)
    return () => observer.disconnect()
  }, [optionKey, revealSelected])

  const page = (direction: 1 | -1) => {
    const strip = stripRef.current
    if (!strip) return
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    strip.scrollBy({ left: direction * strip.clientWidth * 0.75, behavior: reduce ? "auto" : "smooth" })
  }

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
      onScroll={measureOverflow}
      className={cn(
        "relative flex gap-1",
        variant === "row" &&
          "flex-wrap items-center rounded-lg border border-border bg-[var(--well)] p-0.5",
        variant === "tabs" &&
          "flex-nowrap items-end border-b border-border pb-0 overflow-x-auto",
        className,
      )}
    >
      {overflow.start && <ScrollCue side="start" onPage={() => page(-1)} />}
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
              variant === "row" && ["rounded-md border border-transparent px-3 py-1", focusRing, ixControlSoft, rowThumb],
              // The strip scrolls horizontally, which would clip an outer ring.
              // The border-b-2 slot stays transparent: the underline is ixTabUnderline's inset shadow.
              variant === "tabs" && ["shrink-0 rounded-none border-b-2 border-transparent -mb-px px-4 py-2", touchTarget, focusRingInset, ixTabUnderline],
              // Selection (aria-checked) is the only filled state; unselected
              // segments stay transparent so they don't compete with it.
              active ? "text-[var(--accent-text)]" : "text-muted-foreground hover:text-foreground",
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
      {overflow.end && <ScrollCue side="end" onPage={() => page(1)} />}
    </div>
  )
}
