import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";
import { IconTile } from "../primitives/icon-tile";
import { Tag } from "../primitives/tag";
import { toneFor } from "../primitives/tone";
import type { ChatAuthor } from "../types/message";

/**
 * Whether the reader wrote a human message. A message without an author is
 * the reader's, which keeps a two-party transcript as it was. A message with
 * an author is the reader's only when that author is `viewerId`; with no
 * `viewerId`, every authored message belongs to someone else.
 */
export function isViewerMessage(author: ChatAuthor | undefined, viewerId: string | undefined): boolean {
  return author === undefined || author.id === viewerId;
}

export interface MessageAuthorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  author: ChatAuthor;
}

/**
 * The line above a message in a transcript with several participants: the
 * author's avatar, name and, when given, their role as a tag.
 *
 * The avatar's tone comes from the author's id, so a participant keeps one
 * colour for the whole thread and in every product. Tones can repeat between
 * participants, so the name is always shown beside it. The avatar repeats the
 * visible name and is hidden from assistive technology.
 */
export function MessageAuthor({ author, className, ...props }: MessageAuthorProps) {
  return (
    <div data-message-author="" className={cn("flex min-w-0 max-w-full items-center gap-2", className)} {...props}>
      <IconTile
        size="xs"
        src={author.avatarUrl}
        name={author.name}
        tone={toneFor(author.id)}
        className="rounded-full"
      />
      <span className="min-w-0 truncate font-medium text-foreground text-sm" title={author.name}>
        {author.name}
      </span>
      {author.role ? (
        // A long role truncates at half the row, so it never hides the name.
        <Tag size="sm" emphasis="outline" className="max-w-[50%]">
          {author.role}
        </Tag>
      ) : null}
    </div>
  );
}
