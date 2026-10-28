import type { HTMLAttributes } from "react";
import { RunStatusIcon } from "../run/status-meta";
import { MessageAuthor } from "./message-author";

import type { Speaker, SpeakerState } from "@tangle-network/agent-interface/speaker";
export { partitionBySpeaker, type Speaker, type SpeakerPart, type SpeakerSection, type SpeakerState } from "@tangle-network/agent-interface/speaker";

export interface SpeakerHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  speaker: Speaker;
  /** The turn is still running, so a responder that has not reported an end is answering. */
  live?: boolean;
}

/**
 * The line above one responder's answer: the author line every participant
 * gets, then the handle a person types to address the agent, then its state.
 *
 * The state comes from the speaker's own end state, else from `live`. An
 * answering responder shows the running glyph with the word, a failed one the
 * failed glyph with the word, both from `RunStatusIcon`, and a finished one
 * nothing, as a settled run row does. `data-speaker-state` carries all three.
 */
export function SpeakerHeader({ speaker, live = false, ...props }: SpeakerHeaderProps) {
  const state: SpeakerState = speaker.state ?? (live ? "answering" : "done");
  return (
    <MessageAuthor
      author={{ id: speaker.id, name: speaker.name }}
      data-speaker-state={state}
      {...props}
    >
      {speaker.handle ? (
        // A person reads the name first. The handle has no base width and grows only into the space
        // the name and state leave, up to its own width, so it gives way before the name loses a pixel.
        <span className="min-w-0 max-w-fit flex-1 truncate text-muted-foreground text-sm" title={`@${speaker.handle}`}>
          @{speaker.handle}
        </span>
      ) : null}
      {state === "done" ? null : (
        <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-sm">
          <RunStatusIcon status={state === "failed" ? "failed" : "running"} aria-hidden />
          {state === "failed" ? "Failed" : "Answering"}
        </span>
      )}
    </MessageAuthor>
  );
}
