import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Input, Textarea } from "./input"
import { Select, SelectTrigger, SelectValue } from "./select"

/**
 * An empty field's example text must not read as an entered value.
 *
 * Placeholders used `text-muted-foreground`, which is `--text-muted`: the tier
 * one step below body text (#4c4c4c against #2d2d2d in light). An empty PTIN
 * field showing "P01234567" then looked like saved data. `--text-dim` is the
 * faintest TEXT tier — still 4.5:1 on every plane including the field well,
 * which tokens.test.ts asserts — so it is the quietest colour that is still
 * legible, and three tier steps from the value.
 */
const PLACEHOLDER_TIER = "--text-dim"

function placeholderColours(el: HTMLElement): string[] {
  return el.className
    .split(/\s+/)
    .filter((cls) => /^(?:placeholder|data-\[placeholder\]):text-/.test(cls))
}

function expectQuietPlaceholder(el: HTMLElement, what: string) {
  const colours = placeholderColours(el)
  expect(colours, `${what} must declare a placeholder colour`).not.toEqual([])
  for (const cls of colours) {
    expect(cls, `${what} placeholder must use ${PLACEHOLDER_TIER}`).toContain(
      `var(${PLACEHOLDER_TIER})`,
    )
    expect(cls, `${what} placeholder must not be faded with alpha`).not.toMatch(/\/\d{1,3}$/)
  }
}

describe("placeholder text sits on the faintest text tier", () => {
  it("Input", () => {
    render(<Input aria-label="PTIN" placeholder="P01234567" />)
    expectQuietPlaceholder(screen.getByLabelText("PTIN"), "Input")
  })

  it("Textarea", () => {
    render(<Textarea aria-label="Notes" placeholder="Details" />)
    expectQuietPlaceholder(screen.getByLabelText("Notes"), "Textarea")
  })

  it("SelectTrigger", () => {
    render(
      <Select>
        <SelectTrigger aria-label="Filing status">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>,
    )
    expectQuietPlaceholder(screen.getByLabelText("Filing status"), "SelectTrigger")
  })
})
