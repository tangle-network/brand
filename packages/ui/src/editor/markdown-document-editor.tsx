"use client";

import type { Editor } from "@tiptap/react";
import {
  type ComponentType,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { cn } from "../lib/utils";
import { EditorLoadingPlaceholder } from "./editor-loading";
import { type DocumentEditorPeers, loadDocumentEditorPeers } from "./editor-peers";
import { EditorToolbar } from "./editor-toolbar";
import {
  htmlToMarkdown,
  markdownToHtml,
  normalizeMarkdown,
} from "./markdown-conversion";

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
 */
export function createMarkdownDocumentEditor(
  peers: DocumentEditorPeers,
): ComponentType<MarkdownDocumentEditorProps> {
  const { EditorContent, useEditor } = peers.react;
  const StarterKit = peers.starterKit.default;

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
    const initialHtml = useMemo(() => markdownToHtml(value), []);
    const lastAppliedMarkdownRef = useRef(normalizeMarkdown(value));

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: {
            HTMLAttributes: {
              class: "hljs",
            },
          },
        }),
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
        const nextMarkdown = normalizeMarkdown(htmlToMarkdown(currentEditor.getHTML()));
        lastAppliedMarkdownRef.current = nextMarkdown;
        onChange?.(nextMarkdown, currentEditor);
      },
      onCreate: ({ editor: currentEditor }) => {
        onReady?.(currentEditor);
      },
    });

    useEffect(() => {
      if (editor) {
        editor.setEditable(!readOnly);
      }
    }, [editor, readOnly]);

    useEffect(() => {
      if (!editor) {
        return;
      }

      const normalizedValue = normalizeMarkdown(value);
      if (normalizedValue === lastAppliedMarkdownRef.current) {
        return;
      }

      editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
      lastAppliedMarkdownRef.current = normalizedValue;
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

const LazyMarkdownDocumentEditor = lazy(async () => ({
  default: createMarkdownDocumentEditor(await loadDocumentEditorPeers()),
}));

/** Local markdown editor. Loads its tiptap peers on first render. */
export function MarkdownDocumentEditor(props: MarkdownDocumentEditorProps) {
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
