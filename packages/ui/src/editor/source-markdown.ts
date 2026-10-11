/**
 * Source-preserving Markdown for the rich editor.
 *
 * The rich editor holds a ProseMirror document, and a document can only be
 * turned back into Markdown by re-serializing it. Re-serializing rewrites
 * whatever the reader did not touch: list markers, emphasis delimiters,
 * escapes, blank lines, and every construct the editor has no node for (a GFM
 * table became one run-on paragraph). This module keeps the original bytes
 * instead.
 *
 * The file is split into its top-level blocks with `marked`'s lexer, whose
 * token `raw` fields concatenate back to the source. Each block the editor can
 * represent is rendered to HTML carrying a block id; every other block (a
 * table, raw HTML, an image, a task list, a link definition) becomes one atomic
 * source node that holds its raw text. On save:
 *
 * - a block whose node still equals the node it was parsed into is written
 *   back as its original bytes, with its original separator;
 * - a block the reader changed is re-serialized, and the change is merged
 *   into the original bytes (a three-way merge against the block's own
 *   re-serialization), so only the edited span differs; the merge is kept only
 *   when it parses back to exactly what the reader sees, otherwise the block's
 *   re-serialization is written;
 * - a block the reader added is re-serialized.
 *
 * This module is pure: the editor-specific half (ProseMirror nodes, schema,
 * HTML) arrives through `SourceNode` callbacks, so it runs without tiptap.
 */

import { marked, type Token, type Tokens, type TokensList } from "marked";
import TurndownService from "turndown";

/** One top-level block of the source file. */
export interface SourceBlock {
  /** Stable id carried by the editor node parsed from this block. */
  id: string;
  /** Position in the source, used to tell whether two blocks were adjacent. */
  index: number;
  /** The block's bytes, without the line breaks that separate it from the next one. */
  raw: string;
  /** The bytes between this block and the next, or the file's trailing bytes for the last block. */
  gap: string;
  /** False for a block the editor cannot represent; it is shown read-only and kept verbatim. */
  editable: boolean;
  /** The lexer's token type, or the reason the block is read-only. */
  kind: SourceBlockKind;
}

export type SourceBlockKind =
  | "paragraph"
  | "heading"
  | "code"
  | "blockquote"
  | "list"
  | "hr"
  | "table"
  | "html"
  | "image"
  | "checklist"
  | "definition"
  | "markdown";

export interface SourceMarkdown {
  /** Blank lines before the first block. */
  prefix: string;
  /** Bytes after the last block (normally its line break). */
  trailer: string;
  blocks: SourceBlock[];
  byId: ReadonlyMap<string, SourceBlock>;
  /** HTML for the editor: editable blocks tagged with `data-md-block`, the rest as source nodes. */
  html: string;
  /** Link reference definitions of the whole file, so a block re-read alone keeps `[text][ref]` links. */
  links: Readonly<TokensList["links"]>;
  /** Lexer token of each editable block. */
  tokens: ReadonlyMap<string, Token>;
  /** The file's line ending, used for text the editor writes. */
  lineEnding: "\n" | "\r\n";
}

/** HTML attribute that carries a block id from the source HTML into the editor document. */
export const BLOCK_ID_ATTRIBUTE = "data-md-block";
/** HTML attribute that carries a read-only block's raw Markdown. */
export const SOURCE_RAW_ATTRIBUTE = "data-md-raw";
/** HTML attribute that carries a read-only block's kind, which picks its caption. */
export const SOURCE_KIND_ATTRIBUTE = "data-md-kind";

const INLINE_TYPES = new Set(["text", "strong", "em", "codespan", "del", "link", "br", "escape"]);

let documentCounter = 0;

function readOnlyKind(token: Token): SourceBlockKind | null {
  switch (token.type) {
    case "paragraph":
    case "heading":
      return inlineReadOnlyKind((token as Tokens.Paragraph | Tokens.Heading).tokens);
    case "code":
    case "hr":
      return null;
    case "blockquote":
      return blocksReadOnlyKind((token as Tokens.Blockquote).tokens);
    case "list": {
      for (const item of (token as Tokens.List).items) {
        if (item.task) return "checklist";
        const kind = blocksReadOnlyKind(item.tokens);
        if (kind) return kind;
      }
      return null;
    }
    case "table":
      return "table";
    case "html":
      return "html";
    case "def":
      return "definition";
    default:
      return "markdown";
  }
}

function blocksReadOnlyKind(tokens: Token[]): SourceBlockKind | null {
  for (const token of tokens) {
    if (token.type === "space") continue;
    if (token.type === "text") {
      const kind = inlineReadOnlyKind((token as Tokens.Text).tokens ?? []);
      if (kind) return kind;
      continue;
    }
    const kind = readOnlyKind(token);
    if (kind) return kind;
  }
  return null;
}

function inlineReadOnlyKind(tokens: Token[] | undefined): SourceBlockKind | null {
  for (const token of tokens ?? []) {
    if (token.type === "image") return "image";
    if (token.type === "html") return "html";
    if (!INLINE_TYPES.has(token.type)) return "markdown";
    const children = (token as { tokens?: Token[] }).tokens;
    if (children) {
      const kind = inlineReadOnlyKind(children);
      if (kind) return kind;
    }
  }
  return null;
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sourceNodeHtml(block: Pick<SourceBlock, "id" | "raw" | "kind">) {
  return `<div ${BLOCK_ID_ATTRIBUTE}="${block.id}" ${SOURCE_KIND_ATTRIBUTE}="${block.kind}" ${SOURCE_RAW_ATTRIBUTE}="${escapeAttribute(block.raw)}"></div>`;
}

/** Renders one editable block, tagging its root element with the block id. */
function editableBlockHtml(token: Token, id: string): string | null {
  const html = String(marked.parser([token], { async: false, gfm: true })).trim();
  if (!/^<[a-z][a-z0-9]*/i.test(html)) return null;
  return html.replace(/^<([a-z][a-z0-9]*)/i, `<$1 ${BLOCK_ID_ATTRIBUTE}="${id}"`);
}

/**
 * Maps offsets in the line-feed-normalized text back to the original text, so
 * a file with CRLF line endings keeps them.
 */
function originalOffsets(original: string, normalized: string): (offset: number) => number {
  if (original === normalized) return (offset) => offset;
  const map = new Int32Array(normalized.length + 1);
  let o = 0;
  for (let n = 0; n < normalized.length; n++) {
    map[n] = o;
    o += original[o] === "\r" && original[o + 1] === "\n" ? 2 : 1;
  }
  map[normalized.length] = original.length;
  return (offset) => map[offset];
}

function buildHtml(blocks: SourceBlock[], tokens: ReadonlyMap<string, Token>) {
  return blocks
    .map((block) => {
      if (!block.editable) return sourceNodeHtml(block);
      const token = tokens.get(block.id);
      return (token && editableBlockHtml(token, block.id)) ?? sourceNodeHtml(block);
    })
    .join("\n");
}

function finish(
  prefix: string,
  trailer: string,
  blocks: SourceBlock[],
  tokens: ReadonlyMap<string, Token>,
  links: SourceMarkdown["links"],
): SourceMarkdown {
  return {
    prefix,
    trailer,
    blocks,
    byId: new Map(blocks.map((block) => [block.id, block])),
    html: buildHtml(blocks, tokens),
    links,
    tokens,
    lineEnding: [prefix, trailer, ...blocks.map((block) => block.raw + block.gap)].some((text) => text.includes("\r\n"))
      ? "\r\n"
      : "\n",
  };
}

/** The whole file as one read-only block: the fallback when it cannot be split faithfully. */
function wholeFileSource(markdown: string, nonce: string): SourceMarkdown {
  const blocks: SourceBlock[] = markdown.trim()
    ? [{ id: `${nonce}:0`, index: 0, raw: markdown, gap: "", editable: false, kind: "markdown" }]
    : [];
  return finish(blocks.length ? "" : markdown, "", blocks, new Map(), {});
}

/** Splits a Markdown file into source blocks and the editor HTML that carries them. */
export function parseSourceMarkdown(markdown: string): SourceMarkdown {
  const nonce = `m${(documentCounter += 1).toString(36)}`;
  const normalized = markdown.replace(/\r\n?/g, "\n");
  // A lone CR is not a line ending this module can map back, so such a file
  // stays read-only rather than gaining line feeds.
  if (/\r(?!\n)/.test(markdown)) return wholeFileSource(markdown, nonce);
  const tokens = marked.lexer(normalized, { gfm: true });
  if (tokens.map((token) => token.raw).join("") !== normalized) {
    return wholeFileSource(markdown, nonce);
  }
  const toOriginal = originalOffsets(markdown, normalized);
  const slice = (start: number, end: number) => markdown.slice(toOriginal(start), toOriginal(end));

  const blocks: SourceBlock[] = [];
  const blockTokens = new Map<string, Token>();
  let prefix = "";
  let offset = 0;
  for (const token of tokens) {
    const start = offset;
    offset += token.raw.length;
    if (token.type === "space") {
      if (blocks.length === 0) prefix += slice(start, offset);
      else blocks[blocks.length - 1].gap += slice(start, offset);
      continue;
    }
    const body = token.raw.replace(/\n+$/, "");
    const id = `${nonce}:${blocks.length}`;
    const kind = readOnlyKind(token);
    blocks.push({
      id,
      index: blocks.length,
      raw: slice(start, start + body.length),
      gap: slice(start + body.length, offset),
      editable: kind === null,
      kind: kind ?? (token.type as SourceBlockKind),
    });
    blockTokens.set(id, token);
  }
  const last = blocks[blocks.length - 1];
  const trailer = last ? last.gap : "";
  return finish(prefix, trailer, blocks, blockTokens, { ...tokens.links });
}

/**
 * Returns a copy of `source` with the given blocks shown read-only. The editor
 * calls this when its document could not hold a block faithfully.
 */
export function withReadOnlyBlocks(source: SourceMarkdown, ids: ReadonlySet<string>): SourceMarkdown {
  const blocks = source.blocks.map((block) => (
    block.editable && ids.has(block.id) ? { ...block, editable: false, kind: "markdown" as const } : block
  ));
  return finish(source.prefix, source.trailer, blocks, source.tokens, source.links);
}

/** The whole document read-only: the last fallback when the editor cannot map it. */
export function asReadOnlyDocument(markdown: string): SourceMarkdown {
  return wholeFileSource(markdown, `m${(documentCounter += 1).toString(36)}`);
}

/**
 * HTML for one block of Markdown, with no block ids, or null when the text is
 * not a single editable block. `links` resolves reference links defined
 * elsewhere in the file. Used to check that a merged block reads back as the
 * reader's edit.
 */
export function blockHtml(markdown: string, links: SourceMarkdown["links"] = {}): string | null {
  const lexer = new marked.Lexer({ gfm: true });
  Object.assign(lexer.tokens.links, links);
  const tokens = lexer.lex(markdown.replace(/\r\n?/g, "\n")).filter((t) => t.type !== "space");
  if (tokens.length !== 1 || readOnlyKind(tokens[0]) !== null) return null;
  return String(marked.parser(tokens, { async: false, gfm: true }));
}

/* ------------------------------------------------------------------------ */
/* Turndown that writes blocks in their source's own style                   */
/* ------------------------------------------------------------------------ */

interface MarkdownStyle {
  bullet: "-" | "*" | "+";
  orderedDelimiter: "." | ")";
  em: "*" | "_";
  strong: "**" | "__";
  fence: "```" | "~~~";
}

function styleOf(raw: string): MarkdownStyle {
  const bullet = /^[ \t]*([*+-])[ \t]+\S/m.exec(raw)?.[1] as MarkdownStyle["bullet"] | undefined;
  const ordered = /^[ \t]*\d{1,9}([.)])[ \t]+\S/m.exec(raw)?.[1] as MarkdownStyle["orderedDelimiter"] | undefined;
  return {
    bullet: bullet ?? "-",
    orderedDelimiter: ordered ?? ".",
    em: /(^|[^\w*_\\])_[^_\s]/.test(raw) && !/(^|[^\w*\\])\*[^*\s]/.test(raw) ? "_" : "*",
    strong: /(^|[^\w\\])__[^_\s]/.test(raw) && !/\*\*[^*\s]/.test(raw) ? "__" : "**",
    fence: /^[ \t]*~~~/m.test(raw) && !/^[ \t]*```/m.test(raw) ? "~~~" : "```",
  };
}

const turndownCache = new Map<string, TurndownService>();

function turndownFor(style: MarkdownStyle): TurndownService {
  const key = `${style.bullet}${style.orderedDelimiter}${style.em}${style.strong}${style.fence}`;
  const cached = turndownCache.get(key);
  if (cached) return cached;
  const service = new TurndownService({
    bulletListMarker: style.bullet,
    codeBlockStyle: "fenced",
    emDelimiter: style.em,
    strongDelimiter: style.strong,
    fence: style.fence,
    headingStyle: "atx",
    hr: "---",
  });
  // The editor wraps every list item's text in a paragraph. An item with one
  // paragraph is a tight item, so its text sits on the marker's line with no
  // blank line before a nested list.
  service.addRule("listParagraph", {
    filter: (node) =>
      node.nodeName === "P" &&
      node.parentNode?.nodeName === "LI" &&
      Array.from((node.parentNode as HTMLElement).children).filter((child) => child.nodeName === "P").length === 1,
    replacement: (content) => `\n${content}\n`,
  });
  // Turndown pads list markers to four columns ("-   item"); a single space is
  // what people and agents write, and it is what an unedited list keeps.
  service.addRule("listItem", {
    filter: "li",
    replacement(content, node) {
      const element = node as HTMLElement;
      const parent = element.parentNode as HTMLElement | null;
      let prefix = `${style.bullet} `;
      if (parent?.nodeName === "OL") {
        const start = parent.getAttribute("start");
        const index = Array.prototype.indexOf.call(parent.children, element);
        prefix = `${(start ? Number(start) : 1) + index}${style.orderedDelimiter} `;
      }
      const body = content.replace(/^\n+|\n+$/g, "");
      // Continuation lines align under the text; blank lines stay empty.
      const indented = body.replace(/\n(?=[^\n])/g, `\n${" ".repeat(prefix.length)}`);
      return prefix + indented + (element.nextSibling ? "\n" : "");
    },
  });
  service.addRule("strikethrough", {
    filter: ["del", "s", "strike"] as Array<keyof HTMLElementTagNameMap>,
    replacement: (content) => `~~${content}~~`,
  });
  turndownCache.set(key, service);
  return service;
}

/** Markdown for one block of editor HTML, written in the style of `sourceRaw`. */
export function blockMarkdown(html: string, sourceRaw = ""): string {
  return turndownFor(styleOf(sourceRaw)).turndown(html).replace(/^\n+|\n+$/g, "");
}

/* ------------------------------------------------------------------------ */
/* Character diff and the three-way block merge                              */
/* ------------------------------------------------------------------------ */

/** -1: only in the first text; 0: in both; 1: only in the second text. */
export type DiffOp = [-1 | 0 | 1, string];

/** Edit cost past which a diff is abandoned, bounding the trace to a few MB. */
const MAX_DIFF_COST = 1200;

function pushOp(ops: DiffOp[], op: -1 | 0 | 1, text: string) {
  if (!text) return;
  const last = ops[ops.length - 1];
  if (last && last[0] === op) last[1] += text;
  else ops.push([op, text]);
}

/** Myers' O((N+M)D) diff of two strings with a common prefix and suffix removed. */
function myers(a: string, b: string, maxCost: number): DiffOp[] | null {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m ? [[1, b]] : [];
  if (m === 0) return [[-1, a]];
  const limit = Math.min(n + m, maxCost);
  const offset = limit + 1;
  const v = new Int32Array(2 * limit + 3);
  v[offset + 1] = 0;
  const trace: Int32Array[] = [];
  let found = -1;
  for (let d = 0; d <= limit && found < 0; d++) {
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
        ? v[offset + k + 1]
        : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a.charCodeAt(x) === b.charCodeAt(y)) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
  }
  if (found < 0) return null;

  // Walk the trace back from the end, collecting runs as index ranges.
  const runs: Array<[-1 | 0 | 1, number, number]> = [];
  let x = n;
  let y = m;
  for (let d = found; d > 0; d--) {
    const snapshot = trace[d];
    const at = (k: number) => snapshot[k + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    // The snake runs from the move's end back to (x, y).
    const moveEndX = prevK === k + 1 ? prevX : prevX + 1;
    if (x > moveEndX) runs.push([0, moveEndX, x]);
    if (prevK === k + 1) runs.push([1, prevY, prevY + 1]);
    else runs.push([-1, prevX, prevX + 1]);
    x = prevX;
    y = prevY;
  }
  if (x > 0) runs.push([0, 0, x]);

  const ops: DiffOp[] = [];
  for (let i = runs.length - 1; i >= 0; i--) {
    const [op, from, to] = runs[i];
    pushOp(ops, op, op === 1 ? b.slice(from, to) : a.slice(from, to));
  }
  return ops;
}

/** Character diff from `a` to `b`, or null when it would cost more than the bound. */
export function diffText(a: string, b: string, maxCost = MAX_DIFF_COST): DiffOp[] | null {
  let start = 0;
  const shorter = Math.min(a.length, b.length);
  while (start < shorter && a.charCodeAt(start) === b.charCodeAt(start)) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a.charCodeAt(endA - 1) === b.charCodeAt(endB - 1)) {
    endA--;
    endB--;
  }
  const middle = myers(a.slice(start, endA), b.slice(start, endB), maxCost);
  if (!middle) return null;
  const ops: DiffOp[] = [];
  pushOp(ops, 0, a.slice(0, start));
  for (const [op, text] of middle) pushOp(ops, op, text);
  pushOp(ops, 0, a.slice(endA));
  return ops;
}

/**
 * For each boundary between characters of `canonical`, the matching boundary
 * in `raw`, or -1 where the two texts disagree around it. A boundary that two
 * matched runs both claim keeps the earlier one, so text typed at the end of a
 * word lands before any syntax that only the source spells out.
 */
function boundaryMap(ops: DiffOp[], canonicalLength: number, rawLength: number): Int32Array {
  const map = new Int32Array(canonicalLength + 1).fill(-1);
  let c = 0;
  let r = 0;
  for (const [op, text] of ops) {
    if (op === 0) {
      for (let j = 0; j <= text.length; j++) {
        if (map[c + j] < 0) map[c + j] = r + j;
      }
      c += text.length;
      r += text.length;
    } else if (op === -1) {
      c += text.length;
    } else {
      r += text.length;
    }
  }
  if (map[0] < 0) map[0] = 0;
  if (map[canonicalLength] < 0) map[canonicalLength] = rawLength;
  return map;
}

/**
 * Merges edits of one block into its original bytes. `raw` is the block as
 * written; `canonical` is the Markdown of the node first parsed from it. The
 * alignment of the two is computed once and reused for every later edit.
 */
export function createBlockMerger(raw: string, canonical: string): (edited: string) => string | null {
  let map: Int32Array | null | undefined;
  const alignment = () => {
    if (map === undefined) {
      const ops = diffText(canonical, raw);
      map = ops ? boundaryMap(ops, canonical.length, raw.length) : null;
    }
    return map;
  };
  return (edited) => {
    if (edited === canonical) return raw;
    if (raw === canonical) return edited;
    const edit = diffText(canonical, edited);
    const boundaries = alignment();
    if (!edit || !boundaries) return null;

    let out = "";
    let rawCursor = 0;
    let c = 0;
    let hunkStart = -1;
    let inserted = "";
    const flush = () => {
      if (hunkStart < 0) return true;
      const from = boundaries[hunkStart];
      const to = boundaries[c];
      if (from < 0 || to < 0 || to < from || from < rawCursor) return false;
      out += raw.slice(rawCursor, from) + inserted;
      rawCursor = to;
      hunkStart = -1;
      inserted = "";
      return true;
    };
    for (const [op, text] of edit) {
      if (op === 0) {
        if (!flush()) return null;
        c += text.length;
        continue;
      }
      if (hunkStart < 0) hunkStart = c;
      if (op === -1) c += text.length;
      else inserted += text;
    }
    if (!flush()) return null;
    return out + raw.slice(rawCursor);
  };
}

/**
 * Applies the reader's edit (`canonical` to `edited`) to the block's original
 * bytes. Returns null when an edited span cannot be located in the original.
 */
export function mergeBlockEdit(raw: string, canonical: string, edited: string): string | null {
  return createBlockMerger(raw, canonical)(edited);
}

/* ------------------------------------------------------------------------ */
/* Serialization                                                             */
/* ------------------------------------------------------------------------ */

/** One top-level node of the editor document, as the serializer needs it. */
export interface SourceNode {
  /** The source block this node was parsed from; undefined for a node the reader added. */
  block?: SourceBlock;
  /** True while the node equals the node first parsed from its block. */
  unchanged: boolean;
  /** True while the node keeps the type first parsed from its block. */
  sameType: boolean;
  /** The node's Markdown as it stands. A read-only source node returns its raw text. */
  markdown(): string;
  /** Merges `edited` into the block's original bytes, or null when it cannot be located. */
  merge(edited: string): string | null;
  /** Whether `markdown` parses back into exactly this node. */
  reparses(markdown: string): boolean;
}

interface Piece {
  text: string;
  block?: SourceBlock;
  keepsSeparator: boolean;
}

function withLineEnding(text: string, lineEnding: SourceMarkdown["lineEnding"]) {
  return lineEnding === "\n" ? text : text.replace(/\r?\n/g, lineEnding);
}

function editedBlockText(node: SourceNode): string {
  const edited = node.markdown();
  const merged = node.merge(edited);
  if (merged !== null && (merged === edited || node.reparses(merged))) return merged;
  return edited;
}

/** Writes the editor document back as Markdown, keeping every untouched byte of `source`. */
export function serializeSourceMarkdown(source: SourceMarkdown, nodes: readonly SourceNode[]): string {
  const pieces: Piece[] = [];
  for (const node of nodes) {
    const block = node.block;
    let text: string;
    if (block && (node.unchanged || !block.editable)) text = block.raw;
    else if (block) text = withLineEnding(editedBlockText(node), source.lineEnding);
    else text = withLineEnding(node.markdown(), source.lineEnding);
    if (!text.trim()) continue;
    pieces.push({ text, block, keepsSeparator: Boolean(block) && (node.unchanged || node.sameType) });
  }

  let out = source.prefix;
  pieces.forEach((piece, i) => {
    out += piece.text;
    const next = pieces[i + 1];
    if (!next) {
      out += source.blocks.length ? source.trailer : source.lineEnding;
      return;
    }
    const adjacent = piece.block && next.block && next.block.index === piece.block.index + 1;
    out += adjacent && piece.keepsSeparator && next.keepsSeparator
      ? piece.block!.gap
      : source.lineEnding + source.lineEnding;
  });
  return out;
}
