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
const CODE_EXTENSIONS = ["py", "ts", "js", "tsx", "jsx", "sh", "bash"];
const CODE_DOTFILES = ["profile", "bashrc", "bash_logout", "env", "gitignore"];

/** Lowercased trailing extension, or the whole basename for dotfiles (".bashrc" → "bashrc"). */
export function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

/** Resolve a filename + optional MIME type to the renderer format. */
export function detectFileFormat(filename: string, mimeType?: string): FileFormat {
  const ext = fileExtension(filename);

  if (mimeType?.startsWith("application/pdf") || ext === "pdf") return "pdf";
  if (mimeType?.startsWith("image/") || IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "spreadsheet";
  if (CODE_EXTENSIONS.includes(ext) || CODE_DOTFILES.includes(ext)) return "code";
  if (ext === "json") return "json";
  if (ext === "yaml" || ext === "yml") return "yaml";
  if (mimeType === "text/markdown" || ext === "md" || ext === "markdown") return "markdown";
  if (["txt", "log", "text"].includes(ext)) return "text";

  // Unknown extension but a text/plain payload — show as text, not "unknown".
  if (mimeType?.startsWith("text/plain")) return "text";

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

/**
 * Map a filename (or path) to a highlight.js language id for CodeBlock. Returns
 * undefined when there is no confident mapping; CodeBlock then renders themed
 * monospace and lets the highlighter auto-detect, so callers never need a
 * bespoke language table.
 */
export function getSyntaxLanguage(filename: string): string | undefined {
  return EXTENSION_TO_SYNTAX_LANGUAGE[fileExtension(filename)];
}
