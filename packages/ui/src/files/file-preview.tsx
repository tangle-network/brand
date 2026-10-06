/**
 * FilePreview — universal file renderer.
 *
 * Renders any file type:
 * - PDF: PdfViewer's rendered pages at full pane height
 * - Images: fit to the pane on a checker ground; click toggles natural size
 * - Video / audio: native players
 * - CSV: sticky-header table, capped at CSV_PREVIEW_ROW_LIMIT rows
 * - XLSX / XLS: download card
 * - Code (py/json/yaml/ts/js): syntax-highlighted, line-numbered viewer
 * - Markdown: rendered prose
 * - Text: monospace preview
 * - Anything else: text when content is a string, otherwise a download card
 */

import { useState } from "react";
import { Download, Music, X } from "lucide-react";
import type { UrlTransform } from "react-markdown";
import { focusRingInset } from "../lib/focus";
import { cn } from "../lib/utils";
import { Markdown } from "../markdown/markdown";
import { CodeBlock, CopyButton } from "../markdown/code-block";
import { FileCard } from "./file-card";
import {
  fileExtension,
  getCodeLanguage,
  getFormatLabel,
  resolveFilePreviewKind,
  type FilePreviewKind,
} from "./file-format";
import { PdfViewer } from "./pdf-viewer";

export interface FilePreviewProps {
  filename: string;
  content?: string;
  /** Object URL or remote URL for binary content: images, PDF, video, audio. */
  blobUrl?: string;
  mimeType?: string;
  /** Size in bytes; download cards show it when known. */
  size?: number;
  /** Transform Markdown links and images through the shared URL policy. */
  urlTransform?: UrlTransform;
  onClose?: () => void;
  onDownload?: () => void;
  hideHeader?: boolean;
  className?: string;
}

/** Rows rendered by the CSV preview; the count line reports the total. */
export const CSV_PREVIEW_ROW_LIMIT = 500;

const NEEDS_DOWNLOAD_LINK = "This file needs a download link to preview.";
const NO_INLINE_PREVIEW = "This file type has no inline preview.";
const NO_INLINE_CONTENT = "This file has no inline content to preview yet.";

function CodePreview({
  content,
  filename,
  kind,
}: {
  content: string;
  filename: string;
  kind: FilePreviewKind;
}) {
  const lineCount = content.split("\n").length;
  const language = getCodeLanguage(filename, kind);
  // Prefer the extension; for an extensionless file (e.g. one detected from its
  // MIME type) fall back to the highlight language so the label stays meaningful.
  const labelToken = fileExtension(filename) || language || "txt";

  // Same theme-aware highlighter the chat markdown renderer uses, so code looks
  // identical in an artifact pane and inline in a message.
  return (
    <CodeBlock
      code={content}
      language={language}
      label={`${labelToken} · ${lineCount} lines`}
      showLineNumbers
      className="max-h-[70vh] overflow-auto"
    >
      <CopyButton text={content} />
    </CodeBlock>
  );
}

/**
 * Split CSV text into rows of cells (RFC 4180): a quoted cell may hold commas,
 * line breaks, and doubled quotes. Unquoted cells are trimmed; blank lines and
 * a trailing line break add no row.
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let inQuotes = false;

  const endCell = () => {
    row.push(quoted ? cell : cell.trim());
    cell = "";
    quoted = false;
  };
  const endRow = () => {
    endCell();
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (inQuotes) {
      if (char === '"') {
        if (content[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      quoted = true;
      continue;
    }
    if (char === ",") {
      endCell();
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && content[index + 1] === "\n") index += 1;
      endRow();
      continue;
    }
    cell += char;
  }

  if (cell.length > 0 || quoted || row.length > 0) endRow();
  return rows;
}

function CsvPreview({ content }: { content: string }) {
  const [headers = [], ...body] = parseCsv(content);
  if (headers.length === 0) return null;

  const visible = body.slice(0, CSV_PREVIEW_ROW_LIMIT);
  const columnCount = Math.max(headers.length, ...visible.map((cells) => cells.length));
  const capped = body.length > visible.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Content height when short; shrinks and scrolls (sticky header) when tall. */}
      <div className="min-h-0 overflow-auto rounded-[var(--radius-md)] border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {Array.from({ length: columnCount }, (_, column) => (
                <th
                  key={column}
                  className="sticky top-0 whitespace-nowrap border-b border-border bg-card px-3 py-2 text-left text-xs font-semibold text-foreground"
                >
                  {headers[column] ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((cells, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border hover:bg-accent">
                {Array.from({ length: columnCount }, (_, column) => (
                  <td
                    key={column}
                    className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-foreground"
                  >
                    {cells[column] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">
        {capped
          ? `Showing ${visible.length} of ${body.length} rows`
          : `${body.length} ${body.length === 1 ? "row" : "rows"}`}
        {` · ${columnCount} ${columnCount === 1 ? "column" : "columns"}`}
      </p>
    </div>
  );
}

// Checker ground behind images so transparency and edges stay visible in
// every theme; both colors come from the active theme's tokens.
const CHECKER_STYLE = {
  backgroundColor: "var(--color-background)",
  backgroundImage: "repeating-conic-gradient(var(--color-muted) 0% 25%, transparent 0% 50%)",
  backgroundSize: "16px 16px",
} as const;

function ImagePreview({ src, filename }: { src: string; filename: string }) {
  const [naturalSize, setNaturalSize] = useState(false);
  return (
    <div
      className="flex min-h-[12rem] flex-1 overflow-auto rounded-[var(--radius-md)] border border-border"
      style={CHECKER_STYLE}
    >
      <button
        type="button"
        onClick={() => setNaturalSize((value) => !value)}
        aria-pressed={naturalSize}
        aria-label={naturalSize ? "Fit image to pane" : "Show image at natural size"}
        className={cn(
          "flex items-center justify-center",
          focusRingInset,
          naturalSize ? "m-auto cursor-zoom-out" : "h-full w-full cursor-zoom-in p-4",
        )}
      >
        <img
          src={src}
          alt={filename}
          draggable={false}
          className={naturalSize ? "max-w-none" : "max-h-full max-w-full object-contain"}
        />
      </button>
    </div>
  );
}

function VideoPreview({ src, filename }: { src: string; filename: string }) {
  return (
    <div className="flex min-h-[12rem] flex-1 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-background">
      {/* Caption tracks are unknown for an arbitrary artifact, so there is no <track>. */}
      <video
        controls
        preload="metadata"
        src={src}
        aria-label={filename}
        className="max-h-full max-w-full"
      />
    </div>
  );
}

function AudioPreview({ src, filename }: { src: string; filename: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-md)] border border-border bg-background px-6 py-10">
      <Music className="h-10 w-10 text-muted-foreground opacity-60" />
      <p className="max-w-full truncate text-sm font-medium text-foreground">{filename}</p>
      <audio controls preload="metadata" src={src} aria-label={filename} className="w-full max-w-md" />
    </div>
  );
}

function TextPreview({ content }: { content: string }) {
  return (
    <pre className="bg-card rounded-[var(--radius-md)] border border-border p-4 overflow-auto max-h-[70vh] text-sm text-foreground font-mono leading-[1.55]">
      {content}
    </pre>
  );
}

function MarkdownPreview({
  content,
  urlTransform,
}: {
  content: string;
  urlTransform?: UrlTransform;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-background p-5">
      <Markdown urlTransform={urlTransform}>{content}</Markdown>
    </div>
  );
}

function PreviewBody({
  kind,
  filename,
  mimeType,
  content,
  blobUrl,
  size,
  urlTransform,
  onDownload,
}: {
  kind: FilePreviewKind;
  filename: string;
  mimeType?: string;
  content?: string;
  blobUrl?: string;
  size?: number;
  urlTransform?: UrlTransform;
  onDownload?: () => void;
}) {
  const hasText = typeof content === "string";
  // The card takes its icon from the kind, so a spreadsheet or a recording
  // reads as one even when it cannot be shown.
  const card = (sentence: string) => (
    <FileCard
      filename={filename}
      mimeType={mimeType}
      size={size}
      description={sentence}
      onDownload={onDownload}
    />
  );

  switch (kind) {
    case "pdf":
      if (blobUrl) {
        return (
          <PdfViewer
            src={blobUrl}
            filename={filename}
            size={size}
            onDownload={onDownload}
            className="min-h-[24rem] flex-1"
          />
        );
      }
      return card(NEEDS_DOWNLOAD_LINK);
    case "image":
      if (blobUrl) return <ImagePreview src={blobUrl} filename={filename} />;
      // An SVG arrives as text when the host read it as source.
      if (hasText) return <CodePreview content={content} filename={filename} kind="code" />;
      return card(NEEDS_DOWNLOAD_LINK);
    case "video":
      if (blobUrl) return <VideoPreview src={blobUrl} filename={filename} />;
      return card(NEEDS_DOWNLOAD_LINK);
    case "audio":
      if (blobUrl) return <AudioPreview src={blobUrl} filename={filename} />;
      return card(NEEDS_DOWNLOAD_LINK);
    case "csv":
      if (hasText) return <CsvPreview content={content} />;
      return card(NO_INLINE_CONTENT);
    case "code":
    case "json":
    case "yaml":
      if (hasText) return <CodePreview content={content} filename={filename} kind={kind} />;
      return card(NO_INLINE_CONTENT);
    case "markdown":
      if (hasText) return <MarkdownPreview content={content} urlTransform={urlTransform} />;
      return card(NO_INLINE_CONTENT);
    case "text":
      if (hasText) return <TextPreview content={content} />;
      return card(NO_INLINE_CONTENT);
    case "spreadsheet":
      return card("Download to open this workbook in a spreadsheet app.");
    case "binary":
      if (hasText) return <TextPreview content={content} />;
      return card(blobUrl ? NO_INLINE_PREVIEW : NEEDS_DOWNLOAD_LINK);
  }
}

export function FilePreview({
  filename,
  content,
  blobUrl,
  mimeType,
  size,
  urlTransform,
  onClose,
  onDownload,
  hideHeader = false,
  className,
}: FilePreviewProps) {
  const kind = resolveFilePreviewKind(filename, mimeType);
  const previewLabel = getFormatLabel(kind);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {!hideHeader && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">{filename}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {previewLabel}
            </div>
          </div>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              aria-label={`Download ${filename}`}
              className="p-1.5 rounded-[var(--radius-sm)] hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${filename}`}
              className="p-1.5 rounded-[var(--radius-sm)] hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* A flex column so full-height previews (PDF, image, video, CSV) fill
          the pane with `flex-1`, while prose and code keep their own height. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
        <PreviewBody
          kind={kind}
          filename={filename}
          mimeType={mimeType}
          content={content}
          blobUrl={blobUrl}
          size={size}
          urlTransform={urlTransform}
          onDownload={onDownload}
        />
      </div>
    </div>
  );
}
