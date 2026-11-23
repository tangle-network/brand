import { formatBytes } from "../utils/format";
/**
 * UploadProgress — file upload status indicators.
 *
 * Shows a list of files being uploaded with progress bars,
 * completion checkmarks, and error states.
 */

import { AlertCircle, CheckCircle2, FileText, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { useRef, type RefObject } from "react";

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "complete" | "error";
  progress?: number; // 0-100
  error?: string;
}

export interface UploadProgressProps {
  files: UploadFile[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

export function UploadProgress({ files, onRemove, onRetry, className }: UploadProgressProps) {
  if (files.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {files.map((file) => {
        const value = typeof file.progress === "number" && Number.isFinite(file.progress)
          ? Math.min(100, Math.max(0, file.progress)) : undefined;
        return (
          <div
            key={file.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
              file.status === "error"
                ? "border-[var(--surface-danger-border)] bg-[var(--surface-danger-bg)]"
                : file.status === "complete"
                  ? "border-[var(--surface-success-border)] bg-[var(--surface-success-bg)]"
                  : "border-border bg-card",
            )}
          >
            {/* Icon */}
            {file.status === "complete" && (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--surface-success-text)]" />
            )}
            {file.status === "error" && (
              <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--surface-danger-text)]" />
            )}
            {file.status === "uploading" && (
              <span role={value === undefined ? "progressbar" : undefined} aria-label={value === undefined ? `Uploading ${file.name}` : undefined}>
                <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 motion-safe:animate-spin text-primary" />
              </span>
            )}
            {file.status === "pending" && (
              <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}

            {/* Name + size */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground" title={file.name}>{file.name}</span>
                <span className="sr-only">{file.status}</span>
                <span className="shrink-0 text-[length:var(--font-size-help,0.75rem)] text-muted-foreground">{formatBytes(file.size)}</span>
              </div>
              {/* Progress bar */}
              {file.status === "uploading" && value !== undefined && (
                <Progress aria-label={`Uploading ${file.name}`} value={value} className="mt-1 h-1 motion-reduce:[&>*]:transition-none" />
              )}
              {/* Error message */}
              {file.status === "error" && file.error && (
                <p className="mt-0.5 text-[length:var(--font-size-help,0.75rem)] text-[var(--surface-danger-text)]">{file.error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {file.status === "error" && onRetry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRetry(file.id)}
                  aria-label={`Retry ${file.name}`}
                >
                  <RefreshCw aria-hidden="true" />
                </Button>
              )}
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(file.id)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface UploadProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** The current step reported by the upload or import operation. */
  step: string;
  files: UploadFile[];
  onRetry?: (id: string) => void;
  action?: { label: string; onClick: () => void };
  /** Restore focus here when the upload was opened by a hidden file input. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function UploadProgressDialog({ open, onOpenChange, title, step, files, onRetry, action, returnFocusRef }: UploadProgressDialogProps) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={() => {
          opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef?.current ?? opener.current;
          if (target?.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription role="status" aria-atomic="true">{step}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50dvh] overflow-y-auto">
          <UploadProgress files={files} onRetry={onRetry} />
        </div>
        {action && <DialogFooter><Button type="button" onClick={action.onClick}>{action.label}</Button></DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
