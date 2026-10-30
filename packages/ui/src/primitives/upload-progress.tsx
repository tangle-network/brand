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
      {files.map((file) => (
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
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--surface-success-text)]" />
          )}
          {file.status === "error" && (
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--surface-danger-text)]" />
          )}
          {file.status === "uploading" && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          )}
          {file.status === "pending" && (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}

          {/* Name + size */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground">{file.name}</span>
              <span className="shrink-0 text-[length:var(--font-size-help,0.75rem)] text-muted-foreground">{formatBytes(file.size)}</span>
            </div>
            {/* Progress bar */}
            {file.status === "uploading" && file.progress !== undefined && (
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
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
      ))}
    </div>
  );
}
