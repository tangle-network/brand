import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { HighlighterCore, LanguageRegistration, ThemedToken } from "shiki/core";
import { Check, Copy, FileCode2 } from "lucide-react";
import { focusRing, focusRingInset } from "../lib/focus";
import { cn } from "../lib/utils";

// Leave variables unresolved: the browser resolves them on each token span,
// including nested themes, inline overrides and CSS/media changes. No document
// sampling, observers, layout reads or React re-render are needed to recolor code.
const SYNTAX = {
  comment: "var(--syntax-comment, currentColor)",
  keyword: "var(--syntax-keyword, currentColor)",
  string: "var(--syntax-string, currentColor)",
  function: "var(--syntax-function, currentColor)",
  number: "var(--syntax-number, currentColor)",
  variable: "var(--syntax-variable, currentColor)",
  foreground: "var(--syntax-foreground, currentColor)",
} as const;

const SHIKI_THEME = "tangle-syntax";
// Shiki's CSS-variables theme names token roles; each maps onto a Brand syntax token.
const BRAND_COLOR_FOR_SHIKI: Record<string, string> = {
  "var(--shiki-foreground)": SYNTAX.foreground,
  "var(--shiki-token-comment)": SYNTAX.comment,
  "var(--shiki-token-keyword)": SYNTAX.keyword,
  "var(--shiki-token-string)": SYNTAX.string,
  "var(--shiki-token-string-expression)": SYNTAX.string,
  "var(--shiki-token-function)": SYNTAX.function,
  "var(--shiki-token-constant)": SYNTAX.number,
  "var(--shiki-token-link)": SYNTAX.number,
  "var(--shiki-token-parameter)": SYNTAX.variable,
  "var(--shiki-token-punctuation)": SYNTAX.foreground,
};

type GrammarModule = { default: LanguageRegistration[] };
const GRAMMARS: Record<string, () => Promise<GrammarModule>> = {
  typescript: () => import("shiki/langs/typescript.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  bash: () => import("shiki/langs/bash.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  scss: () => import("shiki/langs/scss.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  mdx: () => import("shiki/langs/mdx.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  solidity: () => import("shiki/langs/solidity.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  swift: () => import("shiki/langs/swift.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  csharp: () => import("shiki/langs/csharp.mjs"),
  graphql: () => import("shiki/langs/graphql.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
};

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript", mts: "typescript", cts: "typescript", js: "javascript", mjs: "javascript",
  cjs: "javascript", node: "javascript", sh: "bash", shell: "bash", zsh: "bash", console: "bash",
  shellscript: "bash", py: "python", python3: "python", yml: "yaml", md: "markdown", rs: "rust",
  sol: "solidity", rb: "ruby", kt: "kotlin", cs: "csharp", "c#": "csharp", "c++": "cpp",
  gql: "graphql", svg: "xml", docker: "dockerfile", patch: "diff", htm: "html",
};

const LANGUAGE_NAMES: Record<string, string> = {
  typescript: "TypeScript", tsx: "TSX", javascript: "JavaScript", jsx: "JSX", json: "JSON",
  jsonc: "JSONC", bash: "Bash", python: "Python", html: "HTML", css: "CSS", scss: "SCSS",
  markdown: "Markdown", mdx: "MDX", yaml: "YAML", toml: "TOML", sql: "SQL", diff: "Diff",
  go: "Go", rust: "Rust", solidity: "Solidity", ruby: "Ruby", java: "Java", kotlin: "Kotlin",
  swift: "Swift", php: "PHP", c: "C", cpp: "C++", csharp: "C#", graphql: "GraphQL", xml: "XML",
  dockerfile: "Dockerfile",
};

/** The Shiki grammar for a fence language, or undefined for plain text. */
export function codeBlockGrammar(language: string | undefined): string | undefined {
  if (!language) return undefined;
  const id = language.toLowerCase();
  const resolved = LANGUAGE_ALIASES[id] ?? id;
  return GRAMMARS[resolved] ? resolved : undefined;
}

let highlighterPromise: Promise<HighlighterCore> | undefined;
const grammarLoads = new Map<string, Promise<void>>();

function loadHighlighter(): Promise<HighlighterCore> {
  // The JavaScript regex engine needs no WebAssembly, so it runs under a strict CSP.
  return highlighterPromise ??= Promise.all([import("shiki/core"), import("shiki/engine/javascript")])
    .then(([core, engine]) => core.createHighlighterCore({
      themes: [core.createCssVariablesTheme({ name: SHIKI_THEME, variablePrefix: "--shiki-", fontStyle: true })],
      langs: [],
      engine: engine.createJavaScriptRegexEngine(),
    }))
    .catch((error: unknown) => {
      highlighterPromise = undefined;
      throw error;
    });
}

async function tokenize(code: string, grammar: string): Promise<ThemedToken[][]> {
  const highlighter = await loadHighlighter();
  let load = grammarLoads.get(grammar);
  if (!load) {
    load = GRAMMARS[grammar]!().then((module) => highlighter.loadLanguage(module.default));
    load.catch(() => grammarLoads.delete(grammar));
    grammarLoads.set(grammar, load);
  }
  await load;
  return highlighter.codeToTokensBase(code, { lang: grammar, theme: SHIKI_THEME });
}

function tokenStyle(token: ThemedToken): CSSProperties | undefined {
  const color = token.color ? BRAND_COLOR_FOR_SHIKI[token.color] ?? SYNTAX.foreground : undefined;
  const style = token.fontStyle ?? 0;
  if (!color && !style) return undefined;
  return {
    ...(color ? { color } : {}),
    ...(style & 1 ? { fontStyle: "italic" } : {}),
    ...(style & 2 ? { fontWeight: "bold" } : {}),
    ...(style & 4 ? { textDecoration: "underline" } : {}),
  };
}

export interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  /**
   * Header text. Defaults to the language's name. Set this when the display
   * name differs from the language id, e.g. a file extension ("BASHRC").
   */
  label?: string;
  /** The file the code belongs to, shown in the header with the language. */
  filename?: string;
  showLineNumbers?: boolean;
  /** Force light (true) or dark (false); omitted inherits the nearest theme. */
  light?: boolean;
  children?: ReactNode;
}

/**
 * Code with Shiki highlighting in Brand's syntax colors. It renders readable
 * plain code first (and on the server), then highlights once its grammar loads.
 */
export const CodeBlock = memo(
  ({ code, language, label, filename, showLineNumbers = false, light, className, children, ...props }: CodeBlockProps) => {
    const grammar = codeBlockGrammar(language);
    const [highlighted, setHighlighted] = useState<{ code: string; grammar: string; lines: ThemedToken[][] } | null>(null);
    useEffect(() => {
      if (!grammar) return;
      let active = true;
      void tokenize(code, grammar).then((lines) => {
        if (active) setHighlighted({ code, grammar, lines });
      }).catch(() => {
        // A failed chunk leaves the code readable; a later mount can retry.
      });
      return () => { active = false; };
    }, [code, grammar]);

    const languageName = grammar ? LANGUAGE_NAMES[grammar] : language;
    const headerLabel = label ?? (filename ? undefined : languageName);
    const hasHeader = Boolean(filename || headerLabel);
    const mode = light === undefined ? {} : { "data-theme": light ? "light" : "dark" };
    const preStyle: CSSProperties = {
      margin: 0,
      padding: "var(--code-padding-y, 0.625rem) var(--code-padding-x, 0.75rem)",
      background: "transparent",
      color: SYNTAX.foreground,
      fontSize: "var(--code-font-size, 0.8125rem)",
      lineHeight: "var(--code-line-height, 1.5)",
      overflowX: "auto",
    };
    const codeStyle: CSSProperties = {
      fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)",
      whiteSpace: "pre",
    };
    const lines: Array<Array<{ content: string; style?: CSSProperties }>> =
      highlighted && highlighted.code === code && highlighted.grammar === grammar
        ? highlighted.lines.map((line) => line.map((token) => ({ content: token.content, style: tokenStyle(token) })))
        : code.split("\n").map((line) => [{ content: line }]);
    const regionName = filename ?? headerLabel;

    return (
      <div
        className={cn("group relative overflow-hidden rounded-lg border font-mono", "bg-card border-border", className)}
        data-highlighted={highlighted && highlighted.code === code ? "true" : undefined}
        {...props}
        {...mode}
      >
        {hasHeader && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5 bg-[var(--code-header-bg,hsl(var(--background)))]">
            {filename ? (
              <span className="flex min-w-0 items-center gap-2 font-sans text-sm">
                <FileCode2 aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate font-mono font-medium text-foreground" title={filename}>{filename}</span>
                {languageName && <span className="shrink-0 text-muted-foreground">{languageName}</span>}
              </span>
            ) : (
              <span className="font-sans text-sm font-medium text-muted-foreground">{headerLabel}</span>
            )}
            {children}
          </div>
        )}
        {!hasHeader && children && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {children}
          </div>
        )}
        {/* A long line scrolls the block sideways, which a keyboard reaches only
            if the block takes focus; a label on a bare <pre> is prohibited ARIA,
            so the block is a named region. Inset: the rounded card clips an outer ring. */}
        <pre
          tabIndex={0}
          role="region"
          aria-label={regionName ? `${regionName} code` : "Code"}
          className={focusRingInset}
          style={preStyle}
        >
          <code style={codeStyle}>
            {lines.map((line, index) => (
              <span key={index}>
                {showLineNumbers && (
                  <span
                    aria-hidden="true"
                    data-line-number
                    className="inline-block select-none pr-4 text-right"
                    style={{ color: SYNTAX.comment, minWidth: "2.5em" }}
                  >
                    {index + 1}
                  </span>
                )}
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} style={token.style}>{token.content}</span>
                ))}
                {index < lines.length - 1 ? "\n" : null}
              </span>
            ))}
          </code>
        </pre>
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";

/** Copy-to-clipboard button for use inside CodeBlock. */
export const CopyButton = memo(({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  // Status text for the live region. Cleared before each attempt so a repeat
  // copy or a failure is announced again.
  const [status, setStatus] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleCopy = useCallback(async () => {
    setStatus("");
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setStatus("Copied to clipboard");
    } catch (err) {
      console.warn("Clipboard write failed:", err);
      setCopied(false);
      setStatus("Copy failed");
    }
    timerRef.current = setTimeout(() => {
      setCopied(false);
      setStatus("");
    }, 2000);
  }, [text]);

  const label = copied ? "Copied" : "Copy to clipboard";
  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-md bg-muted border border-border hover:border-[var(--border-strong)] transition-colors",
          focusRing,
        )}
        aria-label={label}
        title={label}
      >
        {copied ? (
          <Check aria-hidden="true" className="w-3.5 h-3.5 text-[var(--surface-success-text)]" />
        ) : (
          <Copy aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      {/* Announce the result; the icon swap alone is silent to screen readers. */}
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
});
CopyButton.displayName = "CopyButton";
