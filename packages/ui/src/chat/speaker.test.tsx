import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MessageAuthor } from "./message-author"
import { partitionBySpeaker, SpeakerHeader, type Speaker } from "./speaker"

type Part = { type: string; id?: string; name?: string; handle?: string; state?: Speaker["state"]; text?: string; speaker?: string }

const writer = { type: "speaker", id: "ap_writer", name: "Writer", handle: "writer" }
const research = { type: "speaker", id: "ap_research", name: "Research Lead", handle: "research-lead" }
const text = (value: string, speaker?: string): Part => ({ type: "text", text: value, ...(speaker ? { speaker } : {}) })

/** Each section as `[speaker id or null, its texts]`. */
const shape = (parts: Part[]) =>
  partitionBySpeaker(parts).map((section) => [section.speaker?.id ?? null, section.parts.map((part) => part.text)])

describe("partitionBySpeaker", () => {
  it("splits a stored row at its speaker parts, in stored order", () => {
    expect(shape([writer, text("headline"), text("subhead"), research, text("risks")])).toEqual([
      ["ap_writer", ["headline", "subhead"]],
      ["ap_research", ["risks"]],
    ])
  })

  it("groups a live stream by each part's speaker tag, not by where it arrived", () => {
    const live = [writer, research, text("headline", "ap_writer"), text("searching", "ap_research"), text("subhead", "ap_writer"), text("risks", "ap_research")]
    expect(shape(live)).toEqual([
      ["ap_writer", ["headline", "subhead"]],
      ["ap_research", ["searching", "risks"]],
    ])
  })

  it("takes a responder's end state from a later speaker part, without a second section", () => {
    const sections = partitionBySpeaker<Part>([writer, research, text("headline", "ap_writer"), { ...writer, state: "done" }, text("risks", "ap_research")])
    expect(sections.map((section) => [section.speaker?.name, section.speaker?.state])).toEqual([["Writer", "done"], ["Research Lead", undefined]])
    expect(sections[1]?.parts.map((part) => part.text)).toEqual(["risks"])
  })

  it("keeps parts no speaker owns, first, and drops none", () => {
    expect(shape([text("preamble"), writer, text("headline"), text("stray", "ap_nobody")])).toEqual([
      [null, ["preamble", "stray"]],
      ["ap_writer", ["headline"]],
    ])
    expect(shape([text("one agent"), text("one answer")])).toEqual([[null, ["one agent", "one answer"]]])
    expect(shape([])).toEqual([[null, []]])
  })
})

describe("SpeakerHeader", () => {
  it("names the responder in its own element, with its handle, answering while the turn runs", () => {
    const { container } = render(<SpeakerHeader speaker={{ id: "ap_writer", name: "Writer", handle: "writer" }} live />)
    expect(screen.getByText(/^Writer$/)).toBeInTheDocument()
    expect(screen.getByText("@writer")).toBeInTheDocument()
    expect(screen.getByText("Answering")).toBeInTheDocument()
    expect(container.querySelector("[data-speaker-state]")?.getAttribute("data-speaker-state")).toBe("answering")
    expect(container.querySelector("[data-run-status]")?.getAttribute("data-run-status")).toBe("running")
  })

  it("says nothing more once the responder has ended, even while others answer", () => {
    const { container } = render(<SpeakerHeader speaker={{ id: "ap_writer", name: "Writer", state: "done" }} live />)
    expect(screen.queryByText("Answering")).not.toBeInTheDocument()
    expect(screen.queryByText("Failed")).not.toBeInTheDocument()
    expect(container.querySelector("[data-speaker-state]")?.getAttribute("data-speaker-state")).toBe("done")
  })

  it("shows a failed responder as failed while the turn still runs", () => {
    const { container } = render(<SpeakerHeader speaker={{ id: "ap_research", name: "Research Lead", state: "failed" }} live />)
    expect(screen.getByText("Failed")).toBeInTheDocument()
    expect(container.querySelector("[data-run-status]")?.getAttribute("data-run-status")).toBe("failed")
    expect(screen.queryByText("Answering")).not.toBeInTheDocument()
  })

  it("treats a responder without an end state on a finished turn as done", () => {
    const { container } = render(<SpeakerHeader speaker={{ id: "ap_writer", name: "Writer" }} />)
    expect(container.querySelector("[data-speaker-state]")?.getAttribute("data-speaker-state")).toBe("done")
  })

  it("draws the author line every participant gets, so an agent keeps its tone", () => {
    const avatar = (node: HTMLElement) => node.querySelector("[aria-hidden]")!.className
    const header = render(<SpeakerHeader speaker={{ id: "ap_writer", name: "Writer" }} />).container
    const author = render(<MessageAuthor author={{ id: "ap_writer", name: "Writer" }} />).container
    expect(avatar(header)).toBe(avatar(author))
  })
})
