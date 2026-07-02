/**
 * ToolCallStep — internal adapter over the canonical `InlineToolItem` row.
 * Maps flat `ToolCallData`-style props (label / status / detail / output /
 * duration) onto a `ToolPart` so `AgentTimeline` and `ToolCallFeed` share the
 * one row implementation. Not exported publicly; only the `ToolCallType` /
 * `ToolCallStatus` vocabulary is (via `ToolCallData`).
 */

import { type ReactNode } from "react";
import { CodeBlock } from "../markdown/code-block";
import type { ToolPart, ToolStatus } from "../types/parts";
import { InlineToolItem } from "./inline-tool-item";

export type ToolCallType =
  | "bash"
  | "read"
  | "write"
  | "edit"
  | "glob"
  | "grep"
  | "list"
  | "download"
  | "inspect"
  | "audit"
  | "unknown";

export type ToolCallStatus = "running" | "success" | "error";

export interface ToolCallStepProps {
  type: ToolCallType;
  label: string;
  status: ToolCallStatus;
  detail?: string;
  output?: string;
  /** Override syntax highlighting language; inferred from detail path if omitted */
  language?: string;
  duration?: number;
  className?: string;
  /** Actions rendered beside the row (e.g. "open in artifacts"). */
  actions?: ReactNode;
  /** Source tool part. When provided, the expanded detail renders from the real
   *  input/output (via ExpandedToolDetail) rather than the flat summary props. */
  part?: ToolPart;
}

const EXT_LANGUAGE: Record<string, string> = {
  ts: "typescript", tsx: "typescript",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  css: "css", scss: "scss",
  json: "json", jsonc: "json",
  md: "markdown", mdx: "markdown",
  py: "python",
  sh: "bash", bash: "bash", zsh: "bash",
  html: "html", htm: "html",
  yaml: "yaml", yml: "yaml",
  toml: "toml",
  rs: "rust",
  go: "go",
  sql: "sql",
  xml: "xml",
};

function inferLanguage(detail?: string, language?: string): string | undefined {
  if (language) return language;
  if (!detail) return undefined;
  const ext = detail.split(".").pop()?.toLowerCase();
  return ext ? EXT_LANGUAGE[ext] : undefined;
}

const STATUS_MAP: Record<ToolCallStatus, ToolStatus> = {
  running: "running",
  success: "completed",
  error: "error",
};

export function ToolCallStep({
  type,
  label,
  status,
  detail,
  output,
  language,
  duration,
  className,
  actions,
  part,
}: ToolCallStepProps) {
  // Fall back to a synthesized part for callers that only have flat props
  // (e.g. ToolCallFeed); the real part, when supplied, drives the expanded view.
  const resolvedPart: ToolPart = part ?? {
    type: "tool",
    id: `${type}:${label}`,
    tool: type,
    state: {
      status: STATUS_MAP[status],
      input: detail ? { detail } : undefined,
      output,
      time: duration != null ? { start: 0, end: duration } : undefined,
    },
  };

  const lang = inferLanguage(detail, language);

  return (
    <InlineToolItem
      part={resolvedPart}
      title={label}
      description={detail}
      className={className}
      actions={actions}
      // With a real part, InlineToolItem's default ExpandedToolDetail renders
      // the full input + output. The synthesized-part path keeps the output-only
      // fallback (it has no real input to show).
      renderToolDetail={
        part
          ? undefined
          : output
            ? () => (
                <CodeBlock
                  code={output}
                  language={lang}
                  className="max-h-72 overflow-auto text-xs"
                />
              )
            : () => null
      }
    />
  );
}

/**
 * ToolCallGroup — groups multiple tool calls under a heading.
 */
export interface ToolCallGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ToolCallGroup({ title, children, className }: ToolCallGroupProps) {
  return (
    <div className={["my-2 space-y-2", className].filter(Boolean).join(" ")}>
      {title && (
        <div className="mb-1 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
