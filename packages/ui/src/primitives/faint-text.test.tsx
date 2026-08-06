import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Input, Textarea } from "./input"
import { StatCard } from "./stat-card"
import { TerminalLine } from "./terminal-display"

/**
 * The quietest line in each primitive — a field hint, a stat subtitle, a log
 * timestamp — must take its colour from a TOKEN, never from a faded stronger
 * one.
 *
 * A translucent foreground does not render the colour it names: it renders that
 * colour composited over whatever plane is behind it. So `text-muted-foreground/70`
 * measures one ratio on a card and a different one on the canvas, and the same
 * markup is legible in one place and not in another. That is how these three
 * landed at 3.65:1, 2.91:1 and 3.4:1 while looking, in the source, like they had
 * been styled deliberately.
 *
 * These assert the RULE rather than the current class string — the point is that
 * faint text carries no alpha, not that it carries one specific token today.
 */

/**
 * A class with its variant chain removed: `dark:hover:text-white/50` → `text-white/50`.
 *
 * Split on the colons that separate variants, which are the ones at bracket
 * depth zero — an arbitrary value carries its own (`text-[color:var(--x)]`,
 * `supports-[display:grid]:`) and splitting on those would mangle the utility.
 */
function bareUtility(cls: string): string {
  let depth = 0
  let start = 0
  for (let i = 0; i < cls.length; i++) {
    const c = cls[i]
    if (c === "[") depth++
    else if (c === "]") depth--
    else if (c === ":" && depth === 0) start = i + 1
  }
  return cls.slice(start)
}

/** Colour utilities, where a trailing `/NN` is an alpha modifier rather than a fraction. */
const COLOUR = "text|bg|border|ring|outline|decoration|placeholder|caret|accent|fill|stroke|divide|from|via|to|shadow"
/** `text-white/70`, `bg-card/60`, `text-[var(--x)]/40`. */
const ALPHA_MODIFIER = new RegExp(`^(?:${COLOUR})-.+/\\d{1,3}$`)
/** `opacity-50` — the same fade by another route. */
const OPACITY_UTILITY = /^opacity-\d{1,3}$/

function expectSolidColour(el: HTMLElement | null, what: string) {
  expect(el, `${what} should render`).not.toBeNull()
  // Per class, not across the whole string: a variant prefix has no whitespace
  // in it, so a single regex over the joined list never sees where one class
  // ends — and `dark:text-white/50` slips past a pattern anchored on spaces.
  const faded = (el?.className ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((cls) => {
      const bare = bareUtility(cls)
      return ALPHA_MODIFIER.test(bare) || OPACITY_UTILITY.test(bare)
    })
  expect(faded, `${what} must take a token, not a faded colour`).toEqual([])
}

describe("the fade detector itself", () => {
  // The guard below is only worth as much as this table. An earlier version
  // anchored on whitespace and so never saw a variant prefix — `dark:text-white/50`
  // read as clean, which is the exact mistake the guard exists to catch.
  const FADED = [
    "text-muted-foreground/70",
    "text-[var(--text-dim)]/70",
    "dark:text-white/50",
    "hover:text-muted-foreground/70",
    "group-hover:text-foreground/40",
    "md:bg-card/60",
    "supports-[display:grid]:text-white/50",
    "opacity-50",
    "hover:opacity-50",
  ]
  const SOLID = [
    "text-[var(--text-dim)]",
    "text-sm",
    "text-muted-foreground",
    "dark:text-white",
    // A slash that is a FRACTION, not an alpha modifier — must not trip the guard.
    "w-1/2",
    "basis-1/3",
    // A colon inside an arbitrary value, which must survive variant-stripping.
    "text-[color:var(--text-dim)]",
  ]
  const isFaded = (cls: string) =>
    ALPHA_MODIFIER.test(bareUtility(cls)) || OPACITY_UTILITY.test(bareUtility(cls))

  for (const cls of FADED) {
    it(`catches ${cls}`, () => expect(isFaded(cls)).toBe(true))
  }
  for (const cls of SOLID) {
    it(`allows ${cls}`, () => expect(isFaded(cls)).toBe(false))
  }
})

describe("faint text is a token, not a faded one", () => {
  it("Input renders its hint at full strength", () => {
    render(<Input label="Name" hint="Shown on your public profile" />)
    expectSolidColour(
      screen.getByText("Shown on your public profile"),
      "the Input hint",
    )
  })

  it("Textarea renders its hint at full strength", () => {
    render(<Textarea label="Bio" hint="Markdown is supported" />)
    expectSolidColour(
      screen.getByText("Markdown is supported"),
      "the Textarea hint",
    )
  })

  it("StatCard renders its subtitle at full strength", () => {
    render(<StatCard title="Sandboxes" value={12} subtitle="up from 9" />)
    expectSolidColour(screen.getByText("up from 9"), "the StatCard subtitle")
  })

  it("TerminalLine renders its timestamp at full strength", () => {
    render(<TerminalLine timestamp="12:04:11">compiling</TerminalLine>)
    expectSolidColour(screen.getByText("[12:04:11]"), "the TerminalLine timestamp")
  })
})
