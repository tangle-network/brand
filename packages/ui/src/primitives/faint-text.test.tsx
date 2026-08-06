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

/** `text-white/70`, `bg-card/60` — a Tailwind alpha modifier on a colour utility. */
const ALPHA_MODIFIER = /(^|\s)[a-z-]*(?:text|bg|border)-[^\s]*\/\d{1,3}(\s|$)/
/** `opacity-50` — the same fade by another route. */
const OPACITY_UTILITY = /(^|\s)opacity-\d{1,3}(\s|$)/

function expectSolidColour(el: HTMLElement | null, what: string) {
  expect(el, `${what} should render`).not.toBeNull()
  const cls = el?.className ?? ""
  expect(cls, `${what} must not fade a colour with an alpha modifier`).not.toMatch(
    ALPHA_MODIFIER,
  )
  expect(cls, `${what} must not fade itself with opacity-*`).not.toMatch(
    OPACITY_UTILITY,
  )
}

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
