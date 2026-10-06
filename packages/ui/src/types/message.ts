/** A single message in a chat session. */
export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  sessionID?: string;
  time?: {
    created?: number;
    updated?: number;
    completed?: number;
  };
  /** Monotonically increasing insertion index for stable ordering. */
  _insertionIndex?: number;
}

/**
 * Who wrote a chat message, for a transcript with more than one person beside
 * the agent: a client, an attorney and the agent in one thread.
 */
export interface ChatAuthor {
  /**
   * Stable participant id. A transcript's `viewerId` is compared with it to
   * tell the reader's own messages apart, and it keys the avatar's tone.
   */
  id: string;
  name: string;
  /**
   * The participant's part in the conversation, shown as a tag beside the
   * name, such as "Attorney". Unrelated to the message's `role`.
   */
  role?: string;
  /** Falls back to initials when absent or when the image fails to load. */
  avatarUrl?: string;
}
