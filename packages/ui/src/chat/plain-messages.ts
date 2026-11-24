import type { SessionMessage } from "../types/message";
import type { SessionPart } from "../types/parts";

/**
 * A chat turn that carries its body as plain text (and an optional model id)
 * instead of the session part map agents use.
 */
export interface PlainChatMessage {
  /** Stable id when the caller already has one; otherwise assigned in order. */
  id?: string;
  role: SessionMessage["role"];
  content: string;
  /** Optional model id for the turn; retained on the session message. */
  model?: string;
}

export interface PlainChatTranscript {
  messages: SessionMessage[];
  partMap: Record<string, SessionPart[]>;
}

/**
 * Map plain `{ role, content, model? }` turns into the shared session message
 * list and text part map that `ChatContainer` renders.
 */
export function mapPlainChatMessages(
  input: readonly PlainChatMessage[],
): PlainChatTranscript {
  const messages: SessionMessage[] = [];
  const partMap: Record<string, SessionPart[]> = {};

  for (let index = 0; index < input.length; index += 1) {
    const turn = input[index]!;
    const id = turn.id && turn.id.length > 0 ? turn.id : `msg-${index}`;
    const message: SessionMessage = {
      id,
      role: turn.role,
      _insertionIndex: index,
    };
    if (turn.model !== undefined) {
      message.model = turn.model;
    }
    messages.push(message);
    partMap[id] = [{ type: "text", text: turn.content }];
  }

  return { messages, partMap };
}
