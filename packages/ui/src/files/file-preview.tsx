/**
 * FilePreview — universal file renderer.
 *
 * Renders any file type beautifully:
 * - PDF: embedded viewer
 * - CSV/XLSX: tabular preview
 * - Code (py/json/yaml/ts/js): syntax-highlighted, line-numbered viewer
 * - Markdown: rendered prose
 * - Images: inline display
 * - Text: monospace preview
 */

import {
  Download,
  X,
  FileText,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Markdown } from "../markdown/markdown";
import { CodeBlock, CopyButton } from "../markdown/code-block";
import {
  detectFileFormat,
  fileExtension,
  getCodeLanguage,
  getFormatLabel,
  type FileFormat,
} from "./file-format";

export interface FilePreviewProps {
  filename: string;
  content?: string;
  blobUrl?: string;
  mimeType?: string;
  onClose?: () => void;
  onDownload?: () => void;
  hideHeader?: boolean;
  className?: string;
}

function CodePreview({
  content,
  filename,
  format,
}: {
  content: string;
  filename: string;
  format: FileFormat;
}) {
  const lineCount = content.split("\n").length;
  const ext = fileExtension(filename) || "txt";

  // Same theme-aware highlighter the chat markdown renderer uses, so code looks
  // identical in an artifact pane and inline in a message.
  return (
    <CodeBlock
      code={content}
      language={getCodeLanguage(filename, format)}
      label={`${ext} · ${lineCount} lines`}
      showLineNumbers
      className="max-h-[70vh] overflow-auto"
    >
      <CopyButton text={content} />
    </CodeBlock>
  );
}

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function CsvPreview({ content }: { content: string }) {
  const lines = content
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length === 0) return null;

  const headers = parseCsvRow(lines[0]).map((header) => header.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    parseCsvRow(line).map((cell) => cell.replace(/^"|"$/g, "")),
  );

  return (
    <div className="overflow-auto max-h-[70vh] rounded-[var(--radius-md)] border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 sticky top-0">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border hover:bg-accent">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-1.5 text-foreground font-mono text-xs whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImagePreview({ src, filename }: { src: string; filename: string }) {
  return (
    <div className="flex items-center justify-center p-4 bg-background rounded-[var(--radius-md)] border border-border">
      <img src={src} alt={filename} className="max-w-full max-h-[70vh] object-contain rounded" />
    </div>
  );
}

function PdfPreview({ blobUrl, filename }: { blobUrl: string; filename: string }) {
  // Simple iframe-based PDF viewer. For richer rendering, consumers can
  // swap in react-pdf at the app level.
  return (
    <div className="rounded-[var(--radius-md)] border border-border overflow-hidden bg-background">
      <iframe
        src={blobUrl}
        title={filename}
        className="w-full h-[70vh] border-0"
      />
    </div>
  );
}

function TextPreview({ content }: { content: string }) {
  return (
    <pre className="bg-background rounded-[var(--radius-md)] border border-border p-4 overflow-auto max-h-[70vh] text-sm text-foreground font-mono leading-[1.55]">
      {content}
    </pre>
  );
}

function UnsupportedPreview({
  filename,
  title,
  description,
}: {
  filename: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border bg-background px-6 py-16 text-center text-muted-foreground">
      <FileText className="mb-3 h-12 w-12 opacity-30" />
      <p className="text-sm text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-xs">{description}</p>
      <p className="mt-4 text-[11px] uppercase tracking-[0.12em]">{filename}</p>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-background p-5">
      <Markdown className="prose-sm max-w-none">{content}</Markdown>
    </div>
  );
}

function EmptyPreview({ filename }: { filename: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <FileText className="h-12 w-12 mb-3 opacity-30" />
      <p className="text-sm">Cannot preview {filename}</p>
      <p className="text-xs mt-1">Download to view this file</p>
    </div>
  );
}

export function FilePreview({
  filename,
  content,
  blobUrl,
  mimeType,
  onClose,
  onDownload,
  hideHeader = false,
  className,
}: FilePreviewProps) {
  const format: FileFormat = detectFileFormat(filename, mimeType);
  const previewLabel = getFormatLabel(format);
  const hasRenderableSource =
    Boolean(content) ||
    Boolean(blobUrl) ||
    format === "unknown" ||
    format === "spreadsheet";

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

      <div className="flex-1 overflow-auto p-3">
        {format === "pdf" && blobUrl && <PdfPreview blobUrl={blobUrl} filename={filename} />}
        {format === "image" && blobUrl && <ImagePreview src={blobUrl} filename={filename} />}
        {format === "csv" && typeof content === "string" && <CsvPreview content={content} />}
        {(format === "code" || format === "json" || format === "yaml") && typeof content === "string" && (
          <CodePreview content={content} filename={filename} format={format} />
        )}
        {format === "text" && typeof content === "string" && <TextPreview content={content} />}
        {format === "markdown" && typeof content === "string" && <MarkdownPreview content={content} />}
        {format === "spreadsheet" && (
          <UnsupportedPreview
            filename={filename}
            title="Spreadsheet preview is not available in this surface"
            description="Download the workbook or convert it to CSV when you need an inline preview."
          />
        )}
        {format === "unknown" && typeof content !== "string" && <EmptyPreview filename={filename} />}
        {format === "unknown" && typeof content === "string" && <TextPreview content={content} />}
        {!hasRenderableSource && typeof content !== "string" && (
          <UnsupportedPreview
            filename={filename}
            title="Preview data is not available yet"
            description="This artifact can be shown once the app provides inline content or a downloadable blob."
          />
        )}
      </div>
    </div>
  );
}
