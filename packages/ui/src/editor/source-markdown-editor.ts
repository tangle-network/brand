/**
 * The tiptap half of source-preserving Markdown editing (see
 * `source-markdown.ts`): a read-only node for blocks the editor cannot
 * represent, a block-id attribute on every top-level node, and the session
 * that maps an editor document back onto the file's original bytes.
 *
 * tiptap arrives as an argument, so this module reaches it through type-only
 * imports, which a bundler erases (see `editor-peers.ts`).
 */

import type * as TiptapReact from "@tiptap/react";
import { marked, type Token, type Tokens } from "marked";
import {
  asReadOnlyDocument,
  BLOCK_ID_ATTRIBUTE,
  blockHtml,
  blockMarkdown,
  createBlockMerger,
  parseSourceMarkdown,
  serializeSourceMarkdown,
  SOURCE_KIND_ATTRIBUTE,
  SOURCE_RAW_ATTRIBUTE,
  withReadOnlyBlocks,
  type SourceBlockKind,
  type SourceMarkdown,
  type SourceNode,
} from "./source-markdown";

type Core = typeof TiptapReact;
type Editor = TiptapReact.Editor;
type PMNode = Editor["state"]["doc"];
type Schema = Editor["schema"];
type DOMOutputSpec = unknown[] | string;

/** Name of the read-only node that holds a block's raw Markdown. */
export const SOURCE_NODE = "markdownSource";

/** Top-level node types that can carry a block id. */
const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  SOURCE_NODE,
];

const CAPTIONS: Record<SourceBlockKind, string> = {
  table: "Table",
  html: "HTML",
  image: "Image",
  checklist: "Checklist",
  definition: "Link definition",
  markdown: "Markdown",
  paragraph: "Markdown",
  heading: "Markdown",
  code: "Markdown",
  blockquote: "Markdown",
  list: "Markdown",
  hr: "Markdown",
};

function inlineText(tokens: Token[] | undefined): string {
  return (tokens ?? [])
    .map((token) => {
      switch (token.type) {
        case "image":
          return (token as Tokens.Image).text;
        case "br":
          return " ";
        case "html":
          return "";
        default: {
          const children = (token as { tokens?: Token[] }).tokens;
          return children ? inlineText(children) : (token as { text?: string }).text ?? "";
        }
      }
    })
    .join("");
}

function tablePreview(raw: string): DOMOutputSpec | null {
  const table = marked.lexer(raw, { gfm: true }).find((token) => token.type === "table") as
    | Tokens.Table
    | undefined;
  if (!table) return null;
  const cell = (tag: "th" | "td", value: Tokens.TableCell) => [tag, {}, inlineText(value.tokens)];
  return [
    "table",
    {},
    ["thead", {}, ["tr", {}, ...table.header.map((value) => cell("th", value))]],
    ["tbody", {}, ...table.rows.map((row) => ["tr", {}, ...row.map((value) => cell("td", value))])],
  ];
}

function sourcePreview(raw: string, kind: SourceBlockKind): DOMOutputSpec[] {
  const caption: DOMOutputSpec = [
    "p",
    { class: "not-prose m-0 mb-2 text-sm text-muted-foreground" },
    `${CAPTIONS[kind] ?? "Markdown"} kept exactly as written. Edit it in the Markdown source.`,
  ];
  const table = kind === "table" ? tablePreview(raw) : null;
  if (table) return [caption, ["div", { class: "overflow-x-auto" }, table]];
  return [caption, ["pre", { class: "m-0 whitespace-pre-wrap" }, ["code", {}, raw]]];
}

/** The read-only source node and the block-id attribute, built from the loaded tiptap. */
export function createSourceMarkdownExtensions(core: Core) {
  const SourceBlock = core.Node.create({
    name: SOURCE_NODE,
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,
    addAttributes() {
      return {
        raw: {
          default: "",
          parseHTML: (element: HTMLElement) => element.getAttribute(SOURCE_RAW_ATTRIBUTE) ?? "",
          renderHTML: (attributes: Record<string, unknown>) => ({ [SOURCE_RAW_ATTRIBUTE]: attributes.raw }),
        },
        kind: {
          default: "markdown",
          parseHTML: (element: HTMLElement) => element.getAttribute(SOURCE_KIND_ATTRIBUTE) ?? "markdown",
          renderHTML: (attributes: Record<string, unknown>) => ({ [SOURCE_KIND_ATTRIBUTE]: attributes.kind }),
        },
      };
    },
    parseHTML() {
      return [{ tag: `div[${SOURCE_RAW_ATTRIBUTE}]` }];
    },
    renderHTML({ node, HTMLAttributes }) {
      return [
        "div",
        core.mergeAttributes(HTMLAttributes, {
          class: "my-3 rounded-lg border border-dashed border-border bg-muted/40 p-3",
        }),
        ...sourcePreview(String(node.attrs.raw ?? ""), node.attrs.kind as SourceBlockKind),
      ] as never;
    },
  });

  const BlockIdentity = core.Extension.create({
    name: "markdownSourceBlockId",
    addGlobalAttributes() {
      return [
        {
          types: BLOCK_TYPES,
          attributes: {
            mdBlock: {
              default: null,
              // A split's new half is new text, not a copy of the source block.
              keepOnSplit: false,
              parseHTML: (element: HTMLElement) => element.getAttribute(BLOCK_ID_ATTRIBUTE),
              renderHTML: (attributes: Record<string, unknown>) =>
                attributes.mdBlock ? { [BLOCK_ID_ATTRIBUTE]: attributes.mdBlock } : {},
            },
          },
        },
      ];
    },
  });

  return [SourceBlock, BlockIdentity];
}

function blockIdOf(node: PMNode): string | null {
  const id = (node.attrs as { mdBlock?: unknown }).mdBlock;
  return typeof id === "string" && id ? id : null;
}

function isEmptyParagraph(node: PMNode) {
  return node.type.name === "paragraph" && node.content.size === 0;
}

function withoutBlockIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutBlockIds);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "mdBlock") continue;
    out[key] = withoutBlockIds(entry);
  }
  return out;
}

/**
 * One open file in the rich editor: its source blocks, the nodes they were
 * first parsed into, and the Markdown written back for the current document.
 */
export class SourceMarkdownSession {
  source: SourceMarkdown;
  private readonly core: Core;
  private readonly markdown: string;
  private readonly initial = new Map<string, PMNode>();
  private readonly mergers = new Map<string, (edited: string) => string | null>();

  constructor(core: Core, markdown: string) {
    this.core = core;
    this.markdown = markdown;
    this.source = parseSourceMarkdown(markdown);
  }

  get html() {
    return this.source.html;
  }

  /**
   * Records the nodes the editor parsed. A block the editor document does not
   * hold as exactly one top-level node (dropped, split, or merged by the
   * schema) is shown read-only instead, so no source byte can be lost.
   */
  attach(editor: Editor) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const unmapped = this.capture(editor.state.doc);
      if (unmapped.size === 0) return;
      this.source = attempt < 2 ? withReadOnlyBlocks(this.source, unmapped) : asReadOnlyDocument(this.markdown);
      editor.commands.setContent(this.source.html, { emitUpdate: false });
    }
    this.capture(editor.state.doc);
  }

  private capture(doc: PMNode): Set<string> {
    this.initial.clear();
    this.mergers.clear();
    const unmapped = new Set<string>();
    let previous: string | null = null;
    doc.forEach((node, _offset, index) => {
      const id = blockIdOf(node);
      if (id && this.source.byId.has(id)) {
        if (this.initial.has(id)) unmapped.add(id);
        else this.initial.set(id, node);
        previous = id;
        return;
      }
      if (index === doc.childCount - 1 && isEmptyParagraph(node)) return;
      // A node with no id came out of the block before it (or the first block).
      const owner = previous ?? this.source.blocks[0]?.id;
      if (owner) unmapped.add(owner);
    });
    for (const block of this.source.blocks) {
      if (!this.initial.has(block.id)) unmapped.add(block.id);
    }
    return unmapped;
  }

  private toMarkdown(node: PMNode, raw: string) {
    const fragment = node.type.schema.topNodeType.create(null, node).content;
    return blockMarkdown(this.core.getHTMLFromFragment(fragment, node.type.schema), raw);
  }

  private reparses(markdown: string, node: PMNode, schema: Schema) {
    const html = blockHtml(markdown, this.source.links);
    if (html === null) return false;
    const parsed = this.core.createDocument(html, schema);
    const nodes: PMNode[] = [];
    parsed.forEach((child) => {
      if (!isEmptyParagraph(child)) nodes.push(child);
    });
    return (
      nodes.length === 1 &&
      JSON.stringify(withoutBlockIds(nodes[0].toJSON())) === JSON.stringify(withoutBlockIds(node.toJSON()))
    );
  }

  private mergerFor(id: string, initial: PMNode, raw: string) {
    let merge = this.mergers.get(id);
    if (!merge) {
      merge = createBlockMerger(raw, this.toMarkdown(initial, raw));
      this.mergers.set(id, merge);
    }
    return merge;
  }

  /** The file's Markdown for `doc`: original bytes wherever the reader changed nothing. */
  serialize(doc: PMNode): string {
    const nodes: SourceNode[] = [];
    doc.forEach((node) => {
      const id = blockIdOf(node);
      const block = id ? this.source.byId.get(id) : undefined;
      const initial = id ? this.initial.get(id) : undefined;
      const raw = node.type.name === SOURCE_NODE ? String(node.attrs.raw ?? "") : null;
      nodes.push({
        block: initial ? block : undefined,
        unchanged: Boolean(initial?.eq(node)),
        sameType: initial?.type === node.type,
        markdown: () => raw ?? this.toMarkdown(node, block?.raw ?? ""),
        merge: (edited) => (initial && block ? this.mergerFor(block.id, initial, block.raw)(edited) : null),
        reparses: (markdown) => this.reparses(markdown, node, node.type.schema),
      });
    });
    return serializeSourceMarkdown(this.source, nodes);
  }
}
