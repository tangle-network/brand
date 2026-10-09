import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import type { ExtraProps } from "react-markdown";
import { Check, Copy } from "lucide-react";
import { focusRing, focusRingInset } from "../lib/focus";
import { cn } from "../lib/utils";

type Element = NonNullable<ExtraProps["node"]>;
type ElementContent = Element["children"][number];

/** A figure: optional sign or currency, digits with separators, an optional unit. */
const NUMERIC_CELL = /^[(]?[-+−]?\s?[$€£¥₹]?\s?\d[\d,_ ]*(?:\.\d+)?\s?(?:%|[kKmMbB]|x|ms|s|h|pp)?[)]?$/;

/** The text of a hast subtree, as a reader sees it. */
function textOf(node: ElementContent | Element): string {
  if (node.type === "text") return node.value;
  if (node.type !== "element") return "";
  return node.children.map(textOf).join("");
}

function rowsOf(table: Element): { header: string[][]; body: string[][] } {
  const header: string[][] = [];
  const body: string[][] = [];
  const visit = (element: Element, inHead: boolean) => {
    for (const child of element.children) {
      if (child.type !== "element") continue;
      if (child.tagName === "tr") {
        const cells = child.children
          .filter((cell): cell is Element => cell.type === "element" && (cell.tagName === "th" || cell.tagName === "td"))
          .map((cell) => textOf(cell).replace(/\s+/g, " ").trim());
        (inHead ? header : body).push(cells);
      } else {
        visit(child, inHead || child.tagName === "thead");
      }
    }
  };
  visit(table, false);
  return { header, body };
}

/** A column is numeric when every non-empty body cell is a figure. */
export function numericColumns(body: string[][]): boolean[] {
  const width = Math.max(0, ...body.map((row) => row.length));
  return Array.from({ length: width }, (_, column) => {
    const cells = body.map((row) => row[column] ?? "").filter(Boolean);
    return cells.length > 0 && cells.every((cell) => NUMERIC_CELL.test(cell));
  });
}

function csvCell(value: string): string {
  // A spreadsheet runs a leading = + - @ as a formula unless the cell is a figure.
  const safe = /^[=+\-@\t\r]/.test(value) && !NUMERIC_CELL.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) || safe !== safe.trim() ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 CSV of a rendered Markdown table, header first. */
export function tableCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

const TableColumns = createContext<boolean[]>([]);
const CellColumn = createContext(-1);

function CopyCsvButton({ csv }: { csv: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(csv);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2000);
  }, [csv]);
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          focusRing,
        )}
      >
        {state === "copied"
          ? <Check aria-hidden className="size-4 text-[var(--surface-success-text)]" />
          : <Copy aria-hidden className="size-4" />}
        {state === "copied" ? "Copied" : "Copy CSV"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? "Table copied as CSV" : state === "failed" ? "Copy failed" : ""}
      </span>
    </>
  );
}

/**
 * A Markdown table as a card: a header row, subtle row lines, figures
 * right-aligned in tabular numerals, a copy-as-CSV control, and horizontal
 * scrolling inside the card when the columns outgrow a phone.
 */
export function MarkdownTable({ node, className, children, ...props }: ComponentProps<"table"> & ExtraProps) {
  const { csv, numeric, rowCount } = useMemo(() => {
    const { header, body } = node ? rowsOf(node) : { header: [], body: [] };
    return { csv: tableCsv([...header, ...body]), numeric: numericColumns(body), rowCount: body.length };
  }, [node]);
  return (
    <div className="not-prose my-4 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1">
        <span className="text-sm text-muted-foreground">{rowCount === 1 ? "1 row" : `${rowCount} rows`}</span>
        <CopyCsvButton csv={csv} />
      </div>
      {/* A keyboard reaches a sideways-scrolling table only when it can take focus. */}
      <div tabIndex={0} role="region" aria-label="Table" className={cn("overflow-x-auto", focusRingInset)}>
        <TableColumns.Provider value={numeric}>
          <table {...props} className={cn("w-full border-collapse text-sm text-foreground", className)}>
            {children}
          </table>
        </TableColumns.Provider>
      </div>
    </div>
  );
}

export function MarkdownTableHead({ node: _node, className, ...props }: ComponentProps<"thead"> & ExtraProps) {
  return <thead {...props} className={cn("bg-muted/50", className)} />;
}

export function MarkdownTableBody({ node: _node, className, ...props }: ComponentProps<"tbody"> & ExtraProps) {
  return <tbody {...props} className={cn("[&>tr:last-child>td]:border-b-0", className)} />;
}

export function MarkdownTableRow({ node: _node, children, ...props }: ComponentProps<"tr"> & ExtraProps) {
  let column = 0;
  return (
    <tr {...props}>
      {Children.map(children, (child) =>
        isValidElement(child)
          ? <CellColumn.Provider value={column++}>{child}</CellColumn.Provider>
          : child,
      )}
    </tr>
  );
}

function useNumericCell(): boolean {
  const numeric = useContext(TableColumns);
  const column = useContext(CellColumn);
  return column >= 0 && numeric[column] === true;
}

export function MarkdownTableHeaderCell({ node: _node, className, ...props }: ComponentProps<"th"> & ExtraProps) {
  const numeric = useNumericCell();
  return (
    <th
      {...props}
      className={cn(
        "whitespace-nowrap border-b border-border px-3 py-2 text-left font-semibold text-foreground",
        numeric && "text-right",
        className,
      )}
    />
  );
}

export function MarkdownTableCell({ node: _node, className, ...props }: ComponentProps<"td"> & ExtraProps) {
  const numeric = useNumericCell();
  return (
    <td
      {...props}
      className={cn(
        "border-b border-border/60 px-3 py-2 align-top",
        numeric ? "whitespace-nowrap text-right tabular-nums" : "min-w-[8rem]",
        className,
      )}
    />
  );
}
