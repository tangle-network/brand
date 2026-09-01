import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UserMessage } from "./user-message"

describe("UserMessage", () => {
  it("renders the text in a borderless muted bubble", () => {
    const { container } = render(<UserMessage content="Run the tests." />)
    expect(screen.getByText("Run the tests.")).toBeInTheDocument()
    const bubble = container.querySelector(".rounded-2xl")
    expect(bubble).not.toBeNull()
    expect(bubble!.className).toContain("bg-muted/50")
    expect(bubble!.className).not.toMatch(/(^|\s)border(\s|$)/)
  })

  it("keeps the timestamp beside the bubble as a hover-revealed label", () => {
    const stamp = new Date(2026, 0, 1, 15, 42)
    const { container } = render(
      <UserMessage content="Run the tests." timestamp={stamp} />,
    )
    const label = container.querySelector("[data-user-message-time]")
    expect(label).not.toBeNull()
    expect(label!.textContent).toBe(
      stamp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    )
    expect(label!.className).toContain("opacity-0")
    expect(label!.className).toContain("group-hover:opacity-100")
  })

  it("renders nothing for an empty message", () => {
    const { container } = render(<UserMessage content="   " />)
    expect(container).toBeEmptyDOMElement()
  })
})
