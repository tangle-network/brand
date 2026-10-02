import type { SessionPart } from "../types/parts";

/** Internal transcript chrome, never attributed to a user or model. */
export function SyntheticText({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div
      role="note"
      aria-label="Application note"
      data-synthetic-text=""
      className="min-w-0 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
    >
      <div className="mb-1 font-medium">Application note</div>
      {/* Plain React text: receipts are not Markdown or executable OpenUI. */}
      <div className="break-words whitespace-pre-wrap">{text}</div>
    </div>
  );
}

export interface UserTextSegment {
  /** Original part index, so subsequent streamed parts do not change keys. */
  index: number;
  synthetic: boolean;
  text: string;
}

/** Keep the existing joined user bubble, splitting only at application notes. */
export function userTextSegments(parts: SessionPart[]): UserTextSegment[] {
  const segments: UserTextSegment[] = [];
  let pending: string[] = [];
  let start = 0;
  const flush = () => {
    const text = pending.join("\n");
    if (text.trim()) segments.push({ index: start, synthetic: false, text });
    pending = [];
  };
  parts.forEach((part, index) => {
    if (part.type !== "text") return;
    if (part.synthetic) {
      flush();
      if (part.text.trim()) {
        segments.push({ index, synthetic: true, text: part.text });
      }
    } else {
      if (pending.length === 0) start = index;
      pending.push(part.text);
    }
  });
  flush();
  return segments;
}
