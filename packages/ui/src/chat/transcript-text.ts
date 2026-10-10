/**
 * The one text treatment for every chat message body, the person's and the
 * agent's alike, so the two differ only by alignment and surface.
 * `tangle-transcript-text` (brand globals.css) reads `--transcript-font-size`
 * and `--transcript-line-height`; the utilities repeat the same tokens for a
 * host that has not loaded brand's globals. `length:` types the token: a bare
 * `text-[var(--x)]` compiles to a color.
 */
export const TRANSCRIPT_TEXT =
  "tangle-transcript-text text-[length:var(--transcript-font-size)] leading-[var(--transcript-line-height)]";
