import { render, screen, within } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"
import type { ChatAuthor } from "../types/message"
import type { SessionPart } from "../types/parts"
import { AgentTimeline, type AgentTimelineItem } from "./agent-timeline"
import { ChatMessage } from "./chat-message"
import { isViewerMessage, MessageAuthor } from "./message-author"
import { UserMessage } from "./user-message"

function html(ui: ReactElement): string {
  return render(ui).container.innerHTML
}

const segmentedParts: SessionPart[] = [
  { type: "text", text: "I signed the lease in March." },
  { type: "text", text: "Lease uploaded: lease.pdf", synthetic: true },
  { type: "text", text: "Here it is." },
]

// The snapshots below were recorded from the components before `author`
// existed. A transcript that names no author must keep that exact markup.
describe("a transcript without authors", () => {
  it("renders ChatMessage as before", () => {
    expect(html(<ChatMessage role="user" content="Can I break my lease early?" />)).toMatchInlineSnapshot(`"<div class="flex flex-col gap-1 items-end"><div class="flex items-center gap-2 px-1 flex-row-reverse"><span class="font-medium text-foreground text-xs">You</span></div><div class="min-w-0 max-w-[85%] space-y-1 rounded-[var(--radius-lg)] bg-foreground px-[var(--chat-message-px)] py-[var(--chat-message-py)] text-background"><div class="whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[var(--line-height-base)]">Can I break my lease early?</div></div></div>"`)
    expect(html(<ChatMessage role="assistant" content="It depends on the lease terms." />)).toMatchInlineSnapshot(`"<div class="flex flex-col gap-1 items-start"><div class="flex items-center gap-2 px-1"><span class="font-medium text-foreground text-xs">Agent</span></div><div class="min-w-0 max-w-[85%] space-y-1 text-foreground"><div class="tangle-prose max-w-none tangle-prose text-[length:var(--font-size-base)] leading-[var(--line-height-base)]"><p>It depends on the lease terms.</p></div></div></div>"`)
    expect(html(<ChatMessage role="system" content="Session started." />)).toMatchInlineSnapshot(`"<div class="flex flex-col gap-1 items-start"><div class="flex items-center gap-2 px-1"><span class="font-medium text-foreground text-xs">Agent</span></div><div class="min-w-0 max-w-[85%] space-y-1 rounded-[var(--radius-lg)] border border-border bg-card px-[var(--chat-message-px)] py-[var(--chat-message-py)]"><div class="tangle-prose max-w-none tangle-prose text-[length:var(--font-size-base)] leading-[var(--line-height-base)]"><p>Session started.</p></div></div></div>"`)
  })

  it("renders UserMessage actions and application notes as before", () => {
    expect(html(<UserMessage content="Can I break my lease early?" actions={<button type="button">Copy</button>} />)).toMatchInlineSnapshot(`"<div class="flex justify-end"><div class="group flex min-w-0 max-w-[78%] flex-col items-end gap-2"><div class="relative w-full min-w-0 rounded-2xl bg-foreground px-4 py-3 text-background"><div class="break-words whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[1.5]">Can I break my lease early?</div></div><div class="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground"><button type="button">Copy</button></div></div></div>"`)
    expect(html(<UserMessage parts={segmentedParts} actions={<button type="button">Copy</button>} />)).toMatchInlineSnapshot(`"<div class="space-y-2"><div class="flex justify-end"><div class="group flex min-w-0 max-w-[78%] flex-col items-end gap-2"><div class="relative w-full min-w-0 rounded-2xl bg-foreground px-4 py-3 text-background"><div class="break-words whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[1.5]">I signed the lease in March.</div></div></div></div><div role="note" aria-label="Application note" data-synthetic-text="" class="min-w-0 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"><div class="mb-1 font-medium">Application note</div><div class="break-words whitespace-pre-wrap">Lease uploaded: lease.pdf</div></div><div class="flex justify-end"><div class="group flex min-w-0 max-w-[78%] flex-col items-end gap-2"><div class="relative w-full min-w-0 rounded-2xl bg-foreground px-4 py-3 text-background"><div class="break-words whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[1.5]">Here it is.</div></div></div></div><div class="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground"><button type="button">Copy</button></div></div>"`)
  })

  it("renders UserMessage as before", () => {
    expect(html(<UserMessage content="Can I break my lease early?" />)).toMatchInlineSnapshot(`"<div class="flex justify-end"><div class="group flex min-w-0 max-w-[78%] flex-col items-end gap-2"><div class="relative w-full min-w-0 rounded-2xl bg-foreground px-4 py-3 text-background"><div class="break-words whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[1.5]">Can I break my lease early?</div></div></div></div>"`)
  })

  it("renders AgentTimeline messages as before", () => {
    expect(
      html(
        <AgentTimeline
          items={[
            { id: "u1", kind: "message", role: "user", content: "Can I break my lease early?" },
            { id: "a1", kind: "message", role: "assistant", content: "It depends on the lease terms." },
          ]}
        />,
      ),
    ).toMatchInlineSnapshot(`"<div class="mx-auto flex w-full max-w-5xl flex-col px-4 py-4"><div data-timeline-step="user" class=""><div class="flex justify-end"><div class="group flex min-w-0 max-w-[78%] flex-col items-end gap-2"><div class="relative w-full min-w-0 rounded-2xl bg-foreground px-4 py-3 text-background"><div class="break-words whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[1.5]">Can I break my lease early?</div></div></div></div></div><div data-timeline-step="prose" class="mt-4"><div><div class="tangle-prose max-w-none tangle-prose text-[length:var(--font-size-base)] leading-[1.5]"><p>It depends on the lease terms.</p></div></div></div></div>"`)
  })
})

const client: ChatAuthor = { id: "client-maria", name: "Maria Lopez", role: "Client" }
const attorney: ChatAuthor = { id: "attorney-jane", name: "Jane Doe", role: "Attorney" }
const agent: ChatAuthor = { id: "agent-intake", name: "Intake assistant", role: "AI" }

/** The bubble that holds a message's text. */
function bubbleOf(text: string): HTMLElement {
  return screen.getByText(text).parentElement as HTMLElement
}

describe("a viewerId without authors", () => {
  it("changes nothing", () => {
    expect(html(<UserMessage content="Hello" viewerId="client-maria" />)).toBe(html(<UserMessage content="Hello" />))
    expect(html(<ChatMessage role="user" content="Hello" viewerId="client-maria" />)).toBe(
      html(<ChatMessage role="user" content="Hello" />),
    )
  })
})

describe("isViewerMessage", () => {
  it("treats an unauthored message as the reader's, and an authored one only when it is the viewer", () => {
    expect(isViewerMessage(undefined, undefined)).toBe(true)
    expect(isViewerMessage(undefined, "client-maria")).toBe(true)
    expect(isViewerMessage(client, "client-maria")).toBe(true)
    expect(isViewerMessage(attorney, "client-maria")).toBe(false)
    expect(isViewerMessage(client, undefined)).toBe(false)
  })
})

describe("MessageAuthor", () => {
  it("shows the name, the role as a tag, and initials in a decorative avatar", () => {
    const { container } = render(<MessageAuthor author={attorney} />)
    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("Attorney")).toBeInTheDocument()
    const avatar = container.querySelector("[aria-hidden]")
    expect(avatar?.textContent).toBe("JD")
  })

  it("omits the tag when the author has no role", () => {
    const { container } = render(<MessageAuthor author={{ id: "guest", name: "Guest" }} />)
    expect(container.querySelectorAll("span")).toHaveLength(2)
  })

  it("keys the avatar tone to the id, so two people with one name stay apart", () => {
    const tones = (author: ChatAuthor) => render(<MessageAuthor author={author} />).container.querySelector("[aria-hidden]")!.className
    const first = tones({ id: "client-maria", name: "Sam Lee" })
    expect(tones({ id: "client-maria", name: "Sam Lee" })).toBe(first)
    expect(tones({ id: "attorney-jane", name: "Sam Lee" })).not.toBe(first)
  })
})

describe("UserMessage with an author", () => {
  it("renders the reader's own message exactly as an unauthored one", () => {
    expect(html(<UserMessage content="Hello" author={client} viewerId={client.id} />)).toBe(html(<UserMessage content="Hello" />))
  })

  it("puts someone else's message at the start, on a card, under their name and role", () => {
    const { container } = render(<UserMessage content="Did you give a forwarding address?" author={attorney} viewerId={client.id} />)
    expect(container.firstElementChild?.className).toContain("justify-start")
    expect(bubbleOf("Did you give a forwarding address?").className).toContain("bg-card")
    expect(bubbleOf("Did you give a forwarding address?").className).not.toContain("bg-foreground")
    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("Attorney")).toBeInTheDocument()
  })

  it("names every author when there is no viewer", () => {
    render(<UserMessage content="Hello" author={client} />)
    expect(screen.getByText("Maria Lopez")).toBeInTheDocument()
  })

  it("names the author once above a message split by application notes", () => {
    const { container } = render(<UserMessage parts={segmentedParts} author={attorney} viewerId={client.id} />)
    expect(screen.getAllByText("Jane Doe")).toHaveLength(1)
    expect(container.querySelectorAll("[data-message-author]")).toHaveLength(1)
    expect(bubbleOf("Here it is.").className).toContain("bg-card")
  })
})

describe("ChatMessage with an author", () => {
  it("keeps the reader's label on their own message", () => {
    render(<ChatMessage role="user" content="Hello" author={client} viewerId={client.id} />)
    expect(screen.getByText("You")).toBeInTheDocument()
    expect(screen.queryByText("Maria Lopez")).not.toBeInTheDocument()
  })

  it("names someone else at the start of the row, on a card", () => {
    const { container } = render(<ChatMessage role="user" content="Hello Maria" author={attorney} viewerId={client.id} />)
    expect(container.firstElementChild?.className).toContain("items-start")
    expect(screen.queryByText("You")).not.toBeInTheDocument()
    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(bubbleOf("Hello Maria").className).toContain("bg-card")
  })

  it("names the agent in place of the assistant label", () => {
    render(<ChatMessage role="assistant" content="Noted." author={agent} />)
    expect(screen.queryByText("Agent")).not.toBeInTheDocument()
    expect(screen.getByText("Intake assistant")).toBeInTheDocument()
  })
})

describe("AgentTimeline with three participants", () => {
  const thread: AgentTimelineItem[] = [
    { id: "m1", kind: "message", role: "user", author: client, content: "My landlord kept my deposit." },
    { id: "m2", kind: "message", role: "assistant", author: agent, content: "I shared your summary with Jane Doe." },
    {
      id: "t1",
      kind: "tool",
      call: { id: "c1", type: "write", label: "Write", status: "success", detail: "intake/summary.md" },
    },
    { id: "m3", kind: "message", role: "assistant", author: agent, content: "The summary has your lease dates." },
    { id: "m4", kind: "message", role: "user", author: attorney, content: "Did you give a forwarding address?" },
    { id: "m5", kind: "message", role: "assistant", author: agent, content: "I added the email to the case file." },
  ]

  it("sets the client's own words apart from the attorney's on the client's screen", () => {
    render(<AgentTimeline items={thread} viewerId={client.id} />)
    expect(bubbleOf("My landlord kept my deposit.").className).toContain("bg-foreground")
    expect(screen.queryByText("Maria Lopez")).not.toBeInTheDocument()
    expect(bubbleOf("Did you give a forwarding address?").className).toContain("bg-card")
    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
  })

  it("mirrors the thread on the attorney's screen", () => {
    render(<AgentTimeline items={thread} viewerId={attorney.id} />)
    expect(bubbleOf("Did you give a forwarding address?").className).toContain("bg-foreground")
    expect(bubbleOf("My landlord kept my deposit.").className).toContain("bg-card")
    expect(screen.getByText("Maria Lopez")).toBeInTheDocument()
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument()
  })

  it("names the agent once per turn, not after each tool row", () => {
    const { container } = render(<AgentTimeline items={thread} viewerId={client.id} />)
    const steps = Array.from(container.querySelectorAll("[data-timeline-step='prose']"))
    const named = steps.map((step) => within(step as HTMLElement).queryByText("Intake assistant") !== null)
    // m2 opens the agent's turn, m3 continues it after the tool row, m5 follows the attorney.
    expect(named).toEqual([true, false, true])
  })
})
