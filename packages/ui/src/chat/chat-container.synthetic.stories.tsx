import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { SessionMessage } from "../types/message";
import type { SessionPart } from "../types/parts";
import { Button } from "../primitives/button";
import { ChatContainer } from "./chat-container";

const messages: SessionMessage[] = [
  { id: "user", role: "user" },
  { id: "assistant", role: "assistant" },
];

type Props = { presentation: "runs" | "timeline"; state: "mixed" | "notes-only" | "pending" };
function TranscriptNotes({ presentation, state }: Props) {
  const [appended, setAppended] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const partMap: Record<string, SessionPart[]> = state === "mixed" ? {
    user: [
      { type: "text", text: "Inspect the available worker results." },
      { type: "text", synthetic: true, text: "Delivery receipt recorded by the application." },
      { type: "text", text: "Tell me which evidence is missing." },
    ],
    assistant: [
      { type: "text", text: "I will inspect the retained result files." },
      { type: "tool", id: "first", tool: "read", state: { status: "completed", input: { path: "results/first.json" }, output: "First worker completed." } },
      { type: "text", synthetic: true, text: "No tool trace was captured for the follow-up worker." },
      { type: "tool", id: "second", tool: "read", state: { status: "error", input: { path: "results/second.json" }, error: "No retained result exists." } },
      { type: "text", text: "Only the first worker has a retained result. The follow-up remains unverified." },
    ],
  } : {
    user: state === "pending" ? [{ type: "text", text: "Inspect the worker results." }] : [],
    assistant: [{ type: "text", synthetic: true, text: state === "pending" ? "Request accepted; no agent response received yet." : "Task not persisted. No agent response or tool trace is available." }],
  };
  if (appended) partMap.assistant.push({ type: "text", synthetic: true, text: "Delivery metadata added locally." });
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      <p className="text-sm text-muted-foreground">Example transcript data. These controls update local story state only.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => setAppended(true)} disabled={appended}>Append application note</Button>
        <span role="status">{inspected ? `Inspected ${inspected}` : "No tool selected"}</span>
      </div>
      <ChatContainer
        messages={messages}
        partMap={partMap}
        isStreaming={state === "pending"}
        presentation={presentation}
        renderToolActions={(part) => <Button type="button" size="sm" variant="ghost" onClick={() => setInspected(part.id)}>Inspect {part.id}</Button>}
        renderTimelineToolActions={(part) => <Button type="button" size="sm" variant="ghost" onClick={() => setInspected(part.id)}>Inspect {part.id}</Button>}
      />
    </div>
  );
}

const meta: Meta<typeof TranscriptNotes> = {
  title: "Chat/Transcript notes",
  component: TranscriptNotes,
  parameters: { layout: "fullscreen" },
  args: { presentation: "runs", state: "mixed" },
};
export default meta;
type Story = StoryObj<typeof TranscriptNotes>;

const checkMixed: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const notes = canvasElement.querySelectorAll('[role="note"]');
  if (notes.length !== 2) throw new Error("Expected both retained application notes");
  for (const note of notes) {
    if (note.closest('.bg-foreground, .tangle-prose, [class*="rounded-[26px]"]')) {
      throw new Error("Application note was attributed to a speaker bubble");
    }
  }
  const append = Array.from(canvasElement.querySelectorAll("button")).find((button) => button.textContent === "Append application note");
  if (!append) throw new Error("Missing story action");
  append.click();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (canvasElement.querySelectorAll('[role="note"]').length !== 3) throw new Error("Appended note was lost");
};

export const MixedRuns: Story = { play: checkMixed };
export const MixedTimeline: Story = { args: { presentation: "timeline" }, play: checkMixed };
export const NotesOnly: Story = { args: { state: "notes-only" } };
export const PendingRuns: Story = { args: { state: "pending" } };
export const PendingTimeline: Story = { args: { presentation: "timeline", state: "pending" } };
