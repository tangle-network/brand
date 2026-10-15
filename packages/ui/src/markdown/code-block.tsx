import {
  memo,
  useId,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { ThemedToken } from "shiki/core";
import { Check, Copy, FileCode2 } from "lucide-react";
import { focusRing, focusRingInset } from "../lib/focus";
import { cn } from "../lib/utils";
import { SYNTAX, LANGUAGE_NAMES, PLAIN_TEXT, codeBlockGrammar, tokenize, tokenStyle, codePreStyle, codeTextStyle, codePresentation, createCopyFeedback, bindCodeTabs, apiMetadataText, type CodeExample, type ApiMetadata } from "../lib/code-presentation";
export { codeBlockGrammar } from "../lib/code-presentation";


export interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  examples?: readonly CodeExample[];
  metadata?: ApiMetadata;
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
  ({ code: defaultCode, language: defaultLanguage, label, filename: defaultFilename, examples, metadata, showLineNumbers = false, light, className, children, ...props }: CodeBlockProps) => {
    const [selected,setSelected]=useState(0);
    const tabId=useId(),tabList=useRef<HTMLDivElement>(null);
    const selectedIndex=Math.min(selected,Math.max(0,(examples?.length??1)-1));
    const example=examples?.[selectedIndex];
    const code=example?.code??defaultCode,language=example?.language??defaultLanguage,filename=example?.filename??defaultFilename;
    useEffect(()=>{if(tabList.current)return bindCodeTabs(tabList.current,setSelected);},[examples?.length]);
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

    // A plain-text fence names no language worth showing; it keeps its copy control.
    const languageName = grammar ? LANGUAGE_NAMES[grammar] : PLAIN_TEXT.has(language?.toLowerCase() ?? "") ? undefined : language;
    const headerLabel = label ?? (filename ? undefined : languageName);
    const hasHeader = Boolean(filename || headerLabel || metadata || examples?.length);
    const mode = light === undefined ? {} : { "data-theme": light ? "light" : "dark" };
    const isHighlighted = Boolean(highlighted && highlighted.code === code && highlighted.grammar === grammar);
    const lines: Array<Array<{ content: string; style?: CSSProperties }>> = isHighlighted
      ? highlighted!.lines.map((line) => line.map((token) => ({ content: token.content, style: tokenStyle(token) })))
      : code.split("\n").map((line) => [{ content: line }]);
    const regionName = filename ?? headerLabel;

    return (
      <div
        className={cn(codePresentation.root, className)}
        data-highlighted={isHighlighted ? "true" : undefined}
        {...props}
        {...mode}
      >
        {hasHeader && (
          <div className={codePresentation.header}>
            {metadata && <span className="tangle-api-meta">{apiMetadataText(metadata)}</span>}
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
            {examples?.length ? <CopyButton text={code}/> : null}
          </div>
        )}
        {!hasHeader && children && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {children}
            {examples?.length ? <CopyButton text={code}/> : null}
          </div>
        )}
        {examples && examples.length > 1 && <div role="tablist" aria-label="Code examples" ref={tabList} className="tangle-code-tabs">
          {examples.map((item,index)=><button key={index} id={`${tabId}-tab-${index}`} type="button" role="tab" aria-selected={index===selectedIndex} tabIndex={index===selectedIndex?0:-1} aria-controls={`${tabId}-panel`}>{item.label}</button>)}
        </div>}
        <div id={`${tabId}-panel`} role={examples?.length ? "tabpanel" : undefined} aria-labelledby={examples?.length ? `${tabId}-tab-${selectedIndex}` : undefined}>
        {/* A long line scrolls the block sideways, which a keyboard reaches only
            if the block takes focus; a label on a bare <pre> is prohibited ARIA,
            so the block is a named region. Inset: the rounded card clips an outer ring. */}
        <pre
          tabIndex={0}
          role="region"
          aria-label={regionName ? `${regionName} code` : "Code"}
          className={focusRingInset}
          style={codePreStyle}
        >
          <code style={codeTextStyle}>
            {/* Plain code without line numbers stays one text node, as the server renders it. */}
            {!isHighlighted && !showLineNumbers ? code : lines.map((line, index) => (
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
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";

/** Copy-to-clipboard button for use inside CodeBlock. */
export const CopyButton = memo(({ text }: { text: string }) => {
  const [{copied,status},setFeedback] = useState({copied:false,status:""});
  const feedback=useRef<ReturnType<typeof createCopyFeedback>|null>(null);
  useEffect(()=>{const controller=createCopyFeedback(setFeedback);feedback.current=controller;return()=>controller.dispose();},[]);
  const handleCopy=()=>void feedback.current?.copy(text);

  const label = copied ? "Copied" : "Copy to clipboard";
  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          codePresentation.copy,
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
