import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type SyntaxHighlighter from "react-syntax-highlighter";
import { Check, Copy } from "lucide-react";
import { focusRing, focusRingInset } from "../lib/focus";
import { cn } from "../lib/utils";

// Leave variables unresolved: the browser resolves them on each token span,
// including nested themes, inline overrides and CSS/media changes. No document
// sampling, observers, layout reads or React re-render are needed to recolor code.
const syntaxTheme: { [key: string]: React.CSSProperties } = (() => {
  const comment = "var(--syntax-comment, currentColor)";
  const keyword = "var(--syntax-keyword, currentColor)";
  const string = "var(--syntax-string, currentColor)";
  const fn = "var(--syntax-function, currentColor)";
  const number = "var(--syntax-number, currentColor)";
  const meta = "var(--syntax-meta, currentColor)";
  const error = "var(--syntax-error, currentColor)";
  const variable = "var(--syntax-variable, currentColor)";
  const fg = "var(--syntax-foreground, currentColor)";
  return {
    "hljs-comment":           { color: comment, fontStyle: "italic" },
    "hljs-quote":             { color: comment, fontStyle: "italic" },
    "hljs-doctag":            { color: comment },
    "hljs-keyword":           { color: keyword },
    "hljs-selector-tag":      { color: keyword },
    "hljs-literal":           { color: keyword },
    "hljs-type":              { color: keyword },
    "hljs-class":             { color: keyword },
    "hljs-string":            { color: string },
    "hljs-template-tag":      { color: string },
    "hljs-template-variable": { color: string },
    "hljs-addition":          { color: string },
    "hljs-regexp":            { color: string },
    "hljs-title":             { color: fn },
    "hljs-section":           { color: fn },
    "hljs-built_in":          { color: fn },
    "hljs-name":              { color: fn },
    "hljs-function":          { color: fn },
    "hljs-selector-id":       { color: fn },
    "hljs-selector-class":    { color: fn },
    "hljs-attribute":         { color: fn },
    "hljs-number":            { color: number },
    "hljs-symbol":            { color: number },
    "hljs-bullet":            { color: number },
    "hljs-link":              { color: number, textDecoration: "underline" },
    "hljs-meta":              { color: meta },
    "hljs-selector-pseudo":   { color: meta },
    "hljs-deletion":          { color: error },
    "hljs-params":            { color: variable },
    "hljs-variable":          { color: variable },
    "hljs-tag":               { color: variable },
    "hljs-attr":              { color: variable },
    "hljs-subst":             { color: variable },
    "hljs-strong":            { fontWeight: "bold" },
    "hljs-emphasis":          { fontStyle: "italic" },
    "hljs":                   { color: fg, background: "transparent" },
  };
})();

type Highlighter = typeof SyntaxHighlighter;
let highlighterPromise: Promise<Highlighter> | undefined;

function loadHighlighter(): Promise<Highlighter> {
  // Preserve the default renderer's language behavior, including alias inputs
  // and unknown-language auto-detection. Its light async variant differs.
  return highlighterPromise ??= import("react-syntax-highlighter/dist/esm/default-highlight")
    .then((module) => module.default)
    .catch((error: unknown) => {
      highlighterPromise = undefined;
      throw error;
    });
}

export interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  /**
   * Header text. Defaults to `language`. Set this when the display name differs
   * from the highlight.js language id — e.g. a file extension ("BASHRC") whose
   * content highlights as a known language, or none.
   */
  label?: string;
  showLineNumbers?: boolean;
  /** Force light (true) or dark (false); omitted inherits the nearest theme. */
  light?: boolean;
  children?: ReactNode;
}

export const CodeBlock = memo(
  ({ code, language, label, showLineNumbers = false, light, className, children, ...props }: CodeBlockProps) => {
    const [Highlighter, setHighlighter] = useState<Highlighter | null>(null);
    useEffect(() => {
      let active = true;
      void loadHighlighter().then((component) => {
        if (active) setHighlighter(() => component);
      }).catch(() => {
        // A failed chunk leaves the code readable; a later mount can retry.
      });
      return () => { active = false; };
    }, []);

    const headerLabel = label ?? language;
    const mode = light === undefined ? {} : { "data-theme": light ? "light" : "dark" };
    const customStyle = {
      margin: 0,
      padding: "var(--code-padding-y, 0.625rem) var(--code-padding-x, 0.75rem)",
      background: "transparent",
      fontSize: "var(--code-font-size, 0.8125rem)",
      lineHeight: "var(--code-line-height, 1.5)",
      overflowX: "auto" as const,
    };
    const codeTagProps = { style: { fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)" } };
    // A long line scrolls the block sideways, which a keyboard reaches only if
    // the block takes focus (axe scrollable-region-focusable). A label on a bare
    // <pre> is prohibited ARIA, so the block is a named region, as the terminal
    // output regions are.
    const scrollRegion = {
      tabIndex: 0,
      role: "region",
      "aria-label": headerLabel ? `${headerLabel} code` : "Code",
      // Inset: the rounded, overflow-clipped card would cut an outer ring.
      className: focusRingInset,
    } as const;

    return (
      <div
        className={cn("group relative overflow-hidden rounded-lg border font-mono", "bg-card border-border", className)}
        {...props}
        {...mode}
      >
        {headerLabel && (
          <div className="flex items-center justify-between border-b border-border px-3 py-1 bg-[var(--code-header-bg,hsl(var(--background)))]">
            <span className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground">
              {headerLabel}
            </span>
            {children}
          </div>
        )}
        {!headerLabel && children && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {children}
          </div>
        )}
        {Highlighter ? (
          <Highlighter
            language={language ?? "text"}
            style={syntaxTheme}
            showLineNumbers={showLineNumbers}
            lineNumberStyle={{
              color: "var(--syntax-comment, currentColor)",
              minWidth: "2.5em",
              paddingRight: "1em",
            }}
            customStyle={customStyle}
            codeTagProps={codeTagProps}
            wrapLines={false}
            {...scrollRegion}
          >
            {code}
          </Highlighter>
        ) : (
          <pre {...scrollRegion} style={{ ...syntaxTheme.hljs, ...customStyle }}>
            <code style={{ ...codeTagProps.style, whiteSpace: "pre" }}>{code}</code>
          </pre>
        )}
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
