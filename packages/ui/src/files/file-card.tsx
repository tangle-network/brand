/**
 * FileCard — one file, described: its kind, name, size, date and uploader,
 * with Download and any actions the host adds. FilePreview shows it for a file
 * it cannot render inline; a host can show it anywhere a file stands on its own.
 */

import * as React from "react";
import {
  Download,
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../primitives/button";
import { IconTile, type IconTileProps } from "../primitives/icon-tile";
import type { CategoryTone } from "../primitives/tone";
import { formatBytes } from "../utils/format";
import { getFormatLabel, resolveFilePreviewKind, type FilePreviewKind } from "./file-format";

/** Who added a file, as a reader of the list should see them. */
export interface FileUploader {
  name: string;
  /** Their relationship to the work, e.g. "Client" or "Attorney". */
  role?: string;
}

/** What FileCard and FileList show about one file. */
export interface FileDetails {
  filename: string;
  /** Wins over the extension when choosing the kind, as in FilePreview. */
  mimeType?: string;
  /** Size in bytes. */
  size?: number;
  /** When the file was added or last changed. */
  date?: Date | string | number;
  uploader?: FileUploader;
}

// File kinds are categories, so each takes a categorical tone and never a
// status colour: a PDF is not an error. See "Color Roles" in the brand guide.
const KIND_ICON: Record<FilePreviewKind, { icon: LucideIcon; tone: CategoryTone }> = {
  pdf: { icon: FileText, tone: "orange" },
  image: { icon: FileImage, tone: "pink" },
  video: { icon: FileVideo, tone: "violet" },
  audio: { icon: FileAudio, tone: "cyan" },
  csv: { icon: FileSpreadsheet, tone: "lime" },
  spreadsheet: { icon: FileSpreadsheet, tone: "lime" },
  code: { icon: FileCode, tone: "blue" },
  json: { icon: FileJson, tone: "blue" },
  yaml: { icon: FileCode, tone: "blue" },
  markdown: { icon: FileText, tone: "teal" },
  text: { icon: FileText, tone: "teal" },
  binary: { icon: File, tone: "brown" },
};

/** The kind's icon on its category tone. Decorative: the filename names the file. */
export function FileKindTile({
  filename,
  mimeType,
  size = "md",
  className,
}: {
  filename: string;
  mimeType?: string;
  size?: IconTileProps["size"];
  className?: string;
}) {
  const { icon: Icon, tone } = KIND_ICON[resolveFilePreviewKind(filename, mimeType)];
  return <IconTile tone={tone} size={size} icon={<Icon />} className={className} />;
}

function toDate(value: FileDetails["date"]): Date | undefined {
  if (value === undefined) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/**
 * A dot between facts for the eye, a comma for a screen reader, which would
 * otherwise read the facts as one run-on word or announce "middle dot".
 */
export function FactSeparator() {
  return (
    <>
      <span aria-hidden="true"> · </span>
      <span className="sr-only">, </span>
    </>
  );
}

/**
 * The kind, size and date as one muted line, each part only when known.
 * The date follows the reader's locale, which a server render may not share,
 * so the element tolerates a hydration difference.
 */
export function FileFacts({
  filename,
  mimeType,
  size,
  date,
  showKind = false,
  className,
}: Pick<FileDetails, "filename" | "mimeType" | "size" | "date"> & {
  showKind?: boolean;
  className?: string;
}) {
  const parsed = toDate(date);
  const parts: React.ReactNode[] = [];
  if (showKind) parts.push(getFormatLabel(resolveFilePreviewKind(filename, mimeType)));
  if (size !== undefined) parts.push(formatBytes(size));
  if (parsed) {
    parts.push(
      <time key="date" dateTime={parsed.toISOString()} suppressHydrationWarning>
        {DATE_FORMAT.format(parsed)}
      </time>,
    );
  }
  if (parts.length === 0) return null;
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <FactSeparator />}
          {part}
        </React.Fragment>
      ))}
    </span>
  );
}

/** "Dana Ruiz (Client)", or the name alone. */
export function uploaderLabel(uploader: FileUploader): string {
  return uploader.role ? `${uploader.name} (${uploader.role})` : uploader.name;
}

export interface FileCardProps
  extends FileDetails,
    Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** One sentence under the details, such as why there is no preview. */
  description?: React.ReactNode;
  /** Adds a Download button. */
  onDownload?: () => void;
  /** Further buttons after Download, such as Open or Delete. */
  actions?: React.ReactNode;
}

export const FileCard = React.forwardRef<HTMLDivElement, FileCardProps>(
  (
    {
      filename,
      mimeType,
      size,
      date,
      uploader,
      description,
      onDownload,
      actions,
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center rounded-[var(--radius-md)] border border-border bg-card px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <FileKindTile filename={filename} mimeType={mimeType} size="lg" />
      <p
        className="mt-3 line-clamp-2 max-w-full text-sm font-medium text-foreground [overflow-wrap:anywhere]"
        title={filename}
      >
        {filename}
      </p>
      <FileFacts filename={filename} size={size} date={date} className="mt-1" />
      {uploader && (
        <p className="mt-0.5 max-w-full truncate text-xs text-muted-foreground">
          Uploaded by {uploaderLabel(uploader)}
        </p>
      )}
      {description && (
        <div className="mt-3 max-w-md text-sm text-muted-foreground">{description}</div>
      )}
      {(onDownload || actions) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onDownload && (
            <Button type="button" variant="outline" size="sm" onClick={onDownload}>
              <Download />
              Download
            </Button>
          )}
          {actions}
        </div>
      )}
    </div>
  ),
);
FileCard.displayName = "FileCard";
