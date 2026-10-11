"use client";

import type { Editor } from "@tiptap/react";
import { type ComponentType, Suspense, useEffect, useMemo, useRef } from "react";
import { cn } from "../lib/utils";
import { retryableLazyEditor } from "./editor-lazy";
import { EditorLoadingPlaceholder } from "./editor-loading";
import { type DocumentEditorPeers, loadDocumentEditorPeers } from "./editor-peers";
import { EditorToolbar } from "./editor-toolbar";
import { normalizeMarkdown } from "./markdown-conversion";
import { createSourceMarkdownExtensions, SourceMarkdownSession } from "./source-markdown-editor";

export interface MarkdownDocumentEditorProps {
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  contentClassName?: string;
  onChange?: (markdown: string, editor: Editor) => void;
  onReady?: (editor: Editor) => void;
}

/**
 * Builds the local markdown editor against loaded tiptap namespaces. The
 * peers arrive as an argument so that this module reaches them through
 * type-only imports, which a bundler erases.
 *
 * The editor writes back the file's own bytes wherever the reader changed
 * nothing (see `source-markdown.ts`): opening a file and leaving it reports no
 * change, and an edit changes only the edited span. Blocks it cannot represent,
 * such as tables, are shown read-only and kept verbatim.
 */
export function createMarkdownDocumentEditor(
  peers: DocumentEditorPeers,
): ComponentType<MarkdownDocumentEditorProps> {
  const { EditorContent, useEditor } = peers.react;
  const StarterKit = peers.starterKit.default;
  const sourceExtensions = createSourceMarkdownExtensions(peers.react);

  return function MarkdownDocumentEditor({
    value = "",
    placeholder = "Start writing...",
    readOnly = false,
    autoFocus = false,
    className,
    contentClassName,
    onChange,
    onReady,
  }: MarkdownDocumentEditorProps) {
    const sessionRef = useRef<SourceMarkdownSession | null>(null);
    if (!sessionRef.current) sessionRef.current = new SourceMarkdownSession(peers.react, value);
    const initialHtml = useMemo(() => sessionRef.current!.html, []);
    // The Markdown last written by this editor or applied from `value`.
    const lastMarkdownRef = useRef(value);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: {
            HTMLAttributes: {
              class: "hljs",
            },
          },
          // Markdown has no underline, so an underline could not be saved.
          underline: false,
        }),
        ...sourceExtensions,
      ],
      content: initialHtml,
      editable: !readOnly,
      autofocus: autoFocus,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm sm:prose-base max-w-none focus:outline-none",
            "prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground",
            "prose-strong:text-foreground prose-code:text-foreground prose-pre:text-foreground",
            contentClassName,
          ),
          "data-placeholder": placeholder,
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        const nextMarkdown = sessionRef.current!.serialize(currentEditor.state.doc);
        // A transaction that changes no Markdown (a selection, a trailing empty
        // paragraph) is not an edit.
        if (nextMarkdown === lastMarkdownRef.current) return;
        lastMarkdownRef.current = nextMarkdown;
        onChangeRef.current?.(nextMarkdown, currentEditor);
      },
      onCreate: ({ editor: currentEditor }) => {
        sessionRef.current!.attach(currentEditor);
        onReady?.(currentEditor);
      },
    });

    useEffect(() => {
      // No update event: toggling read-only is not an edit.
      editor?.setEditable(!readOnly, false);
    }, [editor, readOnly]);

    useEffect(() => {
      if (!editor) {
        return;
      }
      if (normalizeMarkdown(value) === normalizeMarkdown(lastMarkdownRef.current)) {
        return;
      }

      const session = new SourceMarkdownSession(peers.react, value);
      sessionRef.current = session;
      editor.commands.setContent(session.html, { emitUpdate: false });
      session.attach(editor);
      lastMarkdownRef.current = value;
    }, [editor, value]);

    return (
      <div
        className={cn(
          "flex min-h-[14rem] w-full flex-col overflow-hidden rounded-lg border border-border bg-background",
          className,
        )}
      >
        <EditorToolbar
          editor={editor}
          className="border-border bg-card px-2 py-2"
        />
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <EditorContent editor={editor} />
        </div>

        <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }

        .ProseMirror pre {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          overflow-x: auto;
        }

        .ProseMirror code {
          background: hsl(var(--muted));
          border-radius: 0.35rem;
          padding: 0.12rem 0.3rem;
        }

        .ProseMirror pre code {
          background: transparent;
          padding: 0;
        }
      `}</style>
      </div>
    );
  };
}

const lazyMarkdownDocumentEditor = retryableLazyEditor(async () =>
  createMarkdownDocumentEditor(await loadDocumentEditorPeers()),
);

/** Local markdown editor. Loads its tiptap peers on first render. */
export function MarkdownDocumentEditor(props: MarkdownDocumentEditorProps) {
  const LazyMarkdownDocumentEditor = lazyMarkdownDocumentEditor();
  return (
    <Suspense
      fallback={
        <EditorLoadingPlaceholder className={cn("min-h-[14rem]", props.className)} />
      }
    >
      <LazyMarkdownDocumentEditor {...props} />
    </Suspense>
  );
}
