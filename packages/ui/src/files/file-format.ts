/**
 * Shared file-format detection for every file surface — the preview pane, the
 * artifact pane, and code rendering. Centralising extension/MIME → format logic
 * keeps chat and artifact views consistent and avoids the same mapping drifting
 * across components.
 */

export type FileFormat =
  | "pdf"
  | "image"
  | "csv"
  | "spreadsheet"
  | "code"
  | "json"
  | "yaml"
  | "markdown"
  | "text"
  | "unknown";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "svg", "webp"];

const EXTENSION_TO_SYNTAX_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  rs: "rust",
  py: "python",
  go: "go",
  rb: "ruby",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  md: "markdown",
  markdown: "markdown",
  css: "css",
  scss: "scss",
  html: "html",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  bashrc: "bash",
  bash_logout: "bash",
  profile: "bash",
  sql: "sql",
  sol: "solidity",
  proto: "protobuf",
};

// Syntax-mapped extensions that render through their own dedicated format
// instead of the generic code viewer.
const NON_CODE_SYNTAX_EXTENSIONS = new Set(["json", "yaml", "yml", "md", "markdown"]);

// Code files with no highlight language — still shown as themed monospace.
const PLAIN_CODE_EXTENSIONS = ["env", "gitignore"];

// Derived from the syntax map so code detection and highlighting never drift:
// every extension we can highlight (minus those with a dedicated format) routes
// through the code viewer.
const CODE_EXTENSIONS = new Set<string>([
  ...Object.keys(EXTENSION_TO_SYNTAX_LANGUAGE).filter((ext) => !NON_CODE_SYNTAX_EXTENSIONS.has(ext)),
  ...PLAIN_CODE_EXTENSIONS,
]);

/**
 * Lowercased trailing extension. Returns "" for a name with no extension
 * ("README", "json" → ""), and the post-dot name for a dotfile (".bashrc" →
 * "bashrc"). Directory components are ignored so dots in a directory name don't
 * leak in ("my.config/file" → "").
 */
export function fileExtension(filename: string): string {
  const base = filename.slice(filename.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  // No dot → no extension. A leading dot (dotfile) is the one case where the
  // whole post-dot name is the extension key.
  if (dot < 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

/** Bare MIME essence, lowercased with any `; charset=…` parameters stripped. */
function mimeEssence(mimeType?: string): string {
  return mimeType?.split(";")[0]?.trim().toLowerCase() ?? "";
}

/**
 * Resolve a filename + optional MIME type to the renderer format. A specific,
 * authoritative MIME type wins over the extension; otherwise the extension
 * decides; a generic text/plain payload is the final fallback.
 */
export function detectFileFormat(filename: string, mimeType?: string): FileFormat {
  const ext = fileExtension(filename);
  const mime = mimeEssence(mimeType);

  // 1. Specific MIME types are authoritative — they outrank the extension.
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime === "text/markdown") return "markdown";
  if (mime === "application/json") return "json";
  if (mime === "text/csv" || mime === "application/csv") return "csv";
  if (mime === "application/yaml" || mime === "application/x-yaml" || mime === "text/yaml") return "yaml";

  // 2. Fall back to the file extension.
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "spreadsheet";
  if (CODE_EXTENSIONS.has(ext)) return "code";
  if (ext === "json") return "json";
  if (ext === "yaml" || ext === "yml") return "yaml";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (["txt", "log", "text"].includes(ext)) return "text";

  // 3. Unknown extension but a text/plain payload — show as text, not "unknown".
  if (mime === "text/plain") return "text";

  return "unknown";
}

/** Human-facing label for a detected format. */
export function getFormatLabel(format: FileFormat): string {
  switch (format) {
    case "pdf":
      return "PDF";
    case "image":
      return "Image";
    case "csv":
      return "CSV";
    case "spreadsheet":
      return "Spreadsheet";
    case "code":
      return "Code";
    case "json":
      return "JSON";
    case "yaml":
      return "YAML";
    case "markdown":
      return "Markdown";
    case "text":
      return "Text";
    default:
      return "File";
  }
}

/**
 * Map a filename (or path) to a highlight.js language id for CodeBlock. Returns
 * undefined when there is no confident mapping; CodeBlock then renders themed
 * monospace and lets the highlighter auto-detect, so callers never need a
 * bespoke language table.
 */
export function getSyntaxLanguage(filename: string): string | undefined {
  return EXTENSION_TO_SYNTAX_LANGUAGE[fileExtension(filename)];
}

/**
 * Highlight language for a file already classified as a code-like format.
 * `json`/`yaml` are their own highlight language even when detected purely from
 * a MIME type on an extensionless file (where the extension can't reveal it);
 * any other code format keys off the extension.
 */
export function getCodeLanguage(filename: string, format: FileFormat): string | undefined {
  if (format === "json" || format === "yaml") return format;
  return getSyntaxLanguage(filename);
}
