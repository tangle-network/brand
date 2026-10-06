/**
 * FileList — a flat list of documents: each row names the file and its kind,
 * size, date and uploader; selecting the row opens it, and the row's own
 * buttons download or delete it.
 */

import * as React from "react";
import { Download, Trash2 } from "lucide-react";
import { focusRingInset } from "../lib/focus";
import { cn } from "../lib/utils";
import { Button } from "../primitives/button";
import {
  FactSeparator,
  FileFacts,
  FileKindTile,
  uploaderLabel,
  type FileDetails,
} from "./file-card";

export interface FileListItem extends FileDetails {
  /** Stable key, and what `activeId` matches. */
  id: string;
}

export interface FileListProps<T extends FileListItem = FileListItem>
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  files: readonly T[];
  /** Opens a file, usually in a preview. Makes each row a button. */
  onOpen?: (file: T) => void;
  /** Adds a Download button to each row. */
  onDownload?: (file: T) => void;
  /**
   * Adds a Delete button to each row. It calls this at once, so a host that
   * wants a confirmation asks for it here.
   */
  onDelete?: (file: T) => void;
  /** The open file. Its row is marked as the current one. */
  activeId?: string;
  /** Shown in place of the list when `files` is empty. */
  empty?: React.ReactNode;
}

export function FileList<T extends FileListItem>({
  files,
  onOpen,
  onDownload,
  onDelete,
  activeId,
  empty = "No files yet.",
  className,
  ...props
}: FileListProps<T>) {
  if (files.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground",
          className,
        )}
        {...props}
      >
        {empty}
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "divide-y divide-border overflow-hidden rounded-[var(--radius-md)] border border-border bg-card",
        className,
      )}
      {...props}
    >
      {files.map((file) => {
        const active = file.id === activeId;
        const body = (
          <>
            <FileKindTile filename={file.filename} mimeType={file.mimeType} />
            {/* On a phone the name may take two lines and the uploader takes
                its own, since one line of facts cannot hold who sent the file. */}
            <span className="grid min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-medium text-foreground [overflow-wrap:anywhere] sm:line-clamp-1">
                {file.filename}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                <FileFacts
                  filename={file.filename}
                  mimeType={file.mimeType}
                  size={file.size}
                  date={file.date}
                  showKind
                />
                {file.uploader && (
                  <span className="hidden sm:inline">
                    <FactSeparator />
                    {uploaderLabel(file.uploader)}
                  </span>
                )}
              </span>
              {file.uploader && (
                <span className="truncate text-xs text-muted-foreground sm:hidden">
                  {uploaderLabel(file.uploader)}
                </span>
              )}
            </span>
          </>
        );
        return (
          <li
            key={file.id}
            className={cn(
              "flex items-center gap-1 pr-2",
              active ? "bg-primary/10" : onOpen && "hover:bg-[var(--bg-hover)]",
            )}
          >
            {onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(file)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3 text-left",
                  focusRingInset,
                )}
              >
                {body}
              </button>
            ) : (
              <div
                aria-current={active ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3"
              >
                {body}
              </div>
            )}
            {onDownload && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Download ${file.filename}`}
                title="Download"
                onClick={() => onDownload(file)}
              >
                <Download />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${file.filename}`}
                title="Delete"
                className="hover:text-[var(--surface-danger-text)]"
                onClick={() => onDelete(file)}
              >
                <Trash2 />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
