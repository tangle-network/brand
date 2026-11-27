import * as React from "react";
import { dataTablePresentation as part } from "../presentation";
import { cn } from "../lib/utils";
import { formatCost } from "../utils/format";
import { runStatus, statusMeta, type RunStatus } from "../run/status-meta";

/**
 * A table of records on its own card: header, rows, hover, density, numbers aligned on their digits, and cells for a
 * state, a bar, money and no rows. `styles/presentation.css` owns every value, so a Hono page that writes
 * `dataTablePresentation` renders the same table. Under 40rem of its own width a `stack` table shows each row as a block
 * of label and value pairs; a `scroll` table scrolls inside its named region instead.
 */

export type DataTableDensity = "default" | "compact";
/** Attributes for the table element, `data-*` included. */
export type DataTableElementProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & { [key: `data-${string}`]: string | number | boolean | undefined };
export type DataTableLayout = "stack" | "scroll";

export interface DataTableColumn<Row> {
  /** Stable column id; also the cell's `data-column`. */
  key: string;
  header: React.ReactNode;
  cell: (row: Row, index: number) => React.ReactNode;
  /** `end` for numbers, money and durations: right-aligned on tabular digits. */
  align?: "start" | "end" | "center";
  /** The row's title when it stacks; written once, usually the first column. */
  primary?: boolean;
  /** The column's name beside each value when the row stacks. Defaults to `header` when that is a string. */
  label?: string;
  /** Column width as CSS, e.g. `"8rem"` or `"30%"`. */
  width?: string;
  /** Keep the cell on one line. Numbers (`align: "end"`) already do. */
  nowrap?: boolean;
  /** A controlled sort: the caller keeps the row order. */
  sort?: { direction?: "asc" | "desc"; onSort: () => void; label?: string };
  className?: string;
  headerClassName?: string;
}

interface FrameOptions {
  /** The table's accessible name; also the scroll region's name. */
  label: string;
  /** A visible title above the table, inside its card. */
  title?: React.ReactNode;
  /** A short line beside the title: a count, a total, when it was read. */
  meta?: React.ReactNode;
  /** Controls at the end of the title row. */
  actions?: React.ReactNode;
  density?: DataTableDensity;
  layout?: DataTableLayout;
  /** `none` drops the card when the table already sits on one. */
  surface?: "card" | "none";
  /** Heading level of `title`. */
  titleAs?: "h2" | "h3" | "h4";
}

export interface DataTableFrameProps
  extends FrameOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  /** `<thead>`, `<tbody>` and `<tfoot>` of the table, or an ARIA table's row groups when `as="grid"`. */
  children: React.ReactNode;
  /** Attributes for the `<table>` (or the ARIA table element). */
  tableProps?: DataTableElementProps;
  /** A div with `role="table"` instead of a native table, for a virtual list of rows that carry `data-row`. */
  as?: "table" | "grid";
  /** The scrolling element, for a virtual list that measures it. */
  scrollRef?: React.Ref<HTMLDivElement>;
}

function FrameHead({ title, meta, actions, titleAs: Title = "h3" }: Pick<FrameOptions, "title" | "meta" | "actions" | "titleAs">) {
  if (title == null && meta == null && actions == null) return null;
  return (
    <div className={part.head}>
      {title != null && <Title className={part.title}>{title}</Title>}
      {meta != null && <p className={part.meta}>{meta}</p>}
      {actions != null && <div className={part.actions}>{actions}</div>}
    </div>
  );
}

/** The card, its title row and the named scroll region around a table the caller writes in native elements. */
const DataTableFrame = React.forwardRef<HTMLDivElement, DataTableFrameProps>(
  (
    { label, title, meta, actions, density = "default", layout = "scroll", surface = "card", titleAs, children, tableProps, as = "table", scrollRef, className, ...props },
    ref,
  ) => {
    const { className: tableClassName, ...tableAttributes } = tableProps ?? {};
    // A native table scrolls inside a named region. An ARIA table (a virtual list) is its own focusable scroller, so the
    // element a reader reaches as the table is the one the keyboard scrolls.
    const body =
      as === "grid" ? (
        <div
          ref={scrollRef}
          role="table"
          aria-label={label}
          tabIndex={0}
          className={cn(part.scroll, part.table, tableClassName)}
          {...(tableAttributes as React.HTMLAttributes<HTMLDivElement>)}
        >
          {children}
        </div>
      ) : (
        <div ref={scrollRef} className={part.scroll} role="region" aria-label={label} tabIndex={0}>
          <table aria-label={label} className={cn(part.table, tableClassName)} {...(tableAttributes as React.TableHTMLAttributes<HTMLTableElement>)}>
            {children}
          </table>
        </div>
      );
    return (
      <div
        ref={ref}
        data-slot="data-table"
        data-density={density}
        data-layout={layout}
        data-surface={surface}
        className={cn(part.root, className)}
        {...props}
      >
        <FrameHead title={title} meta={meta} actions={actions} titleAs={titleAs} />
        {body}
      </div>
    );
  },
);
DataTableFrame.displayName = "DataTableFrame";

export interface DataTableProps<Row> extends FrameOptions, Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  /** Attributes for the `<table>`. */
  tableProps?: DataTableElementProps;
  columns: ReadonlyArray<DataTableColumn<Row> | false | null | undefined>;
  rows: ReadonlyArray<Row>;
  rowKey: (row: Row, index: number) => React.Key;
  /** Attributes for a row: `aria-current` for the open one, `data-href` with `onClick` for a row that opens a page. */
  rowProps?: (row: Row, index: number) => React.HTMLAttributes<HTMLTableRowElement> & { [key: `data-${string}`]: string | number | boolean | undefined };
  /** Shown in place of rows when there are none. A string becomes the empty state's title. */
  empty?: React.ReactNode;
  /** A `<tfoot>` row, such as totals; one node per column or one spanning node. */
  footer?: React.ReactNode;
}

const sortGlyph = (direction?: "asc" | "desc") => (direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕");
const ariaSort = (direction?: "asc" | "desc") => (direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none");

/** A table of records from its columns and rows. Rows stack under 40rem unless `layout="scroll"`. */
function DataTable<Row>({ columns: given, rows, rowKey, rowProps, empty, footer, layout = "stack", ...frame }: DataTableProps<Row>) {
  const columns = given.filter((column): column is DataTableColumn<Row> => Boolean(column));
  const hasWidths = columns.some((column) => column.width);
  return (
    // Explicit roles: a stacked row is display:block, and browsers drop a table's implicit roles with its display.
    <DataTableFrame layout={layout} {...frame} tableProps={{ role: "table", ...frame.tableProps }}>
      {hasWidths && (
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
      )}
      <thead role="rowgroup">
        <tr role="row">
          {columns.map((column) => (
            <th
              key={column.key}
              role="columnheader"
              scope="col"
              data-column={column.key}
              data-align={column.align === "start" ? undefined : column.align}
              aria-sort={column.sort ? ariaSort(column.sort.direction) : undefined}
              className={column.headerClassName}
            >
              {column.sort ? (
                <button
                  type="button"
                  onClick={column.sort.onSort}
                  aria-label={column.sort.label ?? (typeof column.header === "string" ? `Sort by ${column.header}` : undefined)}
                >
                  {column.header}
                  <span aria-hidden="true">{sortGlyph(column.sort.direction)}</span>
                </button>
              ) : (
                column.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.length === 0 ? (
          <DataTableEmpty colSpan={columns.length} {...(typeof empty === "string" || empty == null ? { title: (empty as string | undefined) ?? "Nothing here yet" } : { children: empty })} />
        ) : (
          rows.map((row, index) => {
            const attributes = rowProps?.(row, index);
            return (
              <tr key={rowKey(row, index)} role="row" {...attributes}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    role="cell"
                    data-column={column.key}
                    data-label={column.primary ? undefined : column.label ?? (typeof column.header === "string" ? column.header : undefined)}
                    data-align={column.align === "start" ? undefined : column.align}
                    data-primary={column.primary || undefined}
                    data-nowrap={column.nowrap || undefined}
                    className={column.className}
                  >
                    {column.cell(row, index)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
      {footer != null && <tfoot>{footer}</tfoot>}
    </DataTableFrame>
  );
}

export interface DataTableStatusProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Any run or job state: running, live, queued, done, passed, failed, cancelled, … (`runStatus` names each once). */
  status: RunStatus | (string & {});
  /** The product's word for the state; the canonical word (`statusMeta`) when omitted. */
  children?: React.ReactNode;
}

/** A state as its own glyph and ink beside its word: Running, Done, Failed, Stopped and Waiting never share a mark. */
const DataTableStatus = React.forwardRef<HTMLSpanElement, DataTableStatusProps>(({ status, children, className, ...props }, ref) => {
  const key = runStatus(status);
  const { label, icon: Icon } = statusMeta(key);
  return (
    <span ref={ref} data-run-status={key} className={cn(part.status, className)} {...props}>
      <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
      <span>{children ?? label}</span>
    </span>
  );
});
DataTableStatus.displayName = "DataTableStatus";

export interface DataTableBarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The row's value; null draws an empty track. */
  value: number | null | undefined;
  /** The column's largest value, so bars compare across rows. */
  max: number;
  /** The value as printed beside the bar, e.g. `"1.8 h"`. */
  children?: React.ReactNode;
  tone?: "accent" | "success" | "danger" | "warning" | "neutral";
}

/** A quantity drawn against the column's largest, with its printed value. */
const DataTableBar = React.forwardRef<HTMLSpanElement, DataTableBarProps>(({ value, max, children, tone = "accent", className, style, ...props }, ref) => {
  const share = value != null && Number.isFinite(value) && max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <span
      ref={ref}
      className={cn(part.bar, className)}
      data-tone={tone === "accent" ? undefined : tone}
      style={{ ...style, ["--tangle-dt-bar" as string]: `${(share * 100).toFixed(2)}%` }}
      {...props}
    >
      <span className={part.barTrack} aria-hidden="true">
        <span className={part.barFill} data-empty={share === 0 || undefined} />
      </span>
      {children != null && <span className={part.barValue}>{children}</span>}
    </span>
  );
});
DataTableBar.displayName = "DataTableBar";

export interface DataTableMoneyProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** US dollars; null or undefined is unknown and prints a dash, never a zero. */
  value: number | null | undefined;
  /** `at-least` prints ≥ (a lower bound), `estimated` prints ≈. */
  qualifier?: "at-least" | "estimated";
  /** Why the value is unknown, as the dash's title and its accessible text. */
  unknown?: string;
}

/** Dollars as `formatCost` writes them, on tabular digits, with a bound or estimate marked and unknown kept apart from zero. */
const DataTableMoney = React.forwardRef<HTMLSpanElement, DataTableMoneyProps>(({ value, qualifier, unknown = "Not priced", className, title, ...props }, ref) => {
  if (value == null || !Number.isFinite(value) || value < 0) {
    return (
      <span ref={ref} className={cn(part.money, className)} data-unknown="" title={title ?? unknown} {...props}>
        <span aria-hidden="true">—</span>
        <span className={part.srOnly}>{unknown}</span>
      </span>
    );
  }
  const text = formatCost(value);
  const mark = qualifier === "at-least" ? "≥" : qualifier === "estimated" ? "≈" : null;
  return (
    <span
      ref={ref}
      className={cn(part.money, className)}
      title={title ?? (qualifier === "at-least" ? `at least ${text}` : qualifier === "estimated" ? `about ${text}` : undefined)}
      {...props}
    >
      {mark && <span className={part.moneyMark} aria-hidden="true">{mark}</span>}
      {text}
    </span>
  );
});
DataTableMoney.displayName = "DataTableMoney";

export interface DataTableEmptyProps extends Omit<React.HTMLAttributes<HTMLTableRowElement>, "title"> {
  colSpan: number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

/** The one row a table shows when it has none: what would be here, and what to do. */
const DataTableEmpty = React.forwardRef<HTMLTableRowElement, DataTableEmptyProps>(({ colSpan, title, description, action, children, className, ...props }, ref) => (
  <tr ref={ref} className={cn(part.empty, className)} {...props}>
    <td colSpan={colSpan}>
      {children ?? (
        <>
          {title != null && <p className={part.emptyTitle}>{title}</p>}
          {description != null && <p className={part.emptyDescription}>{description}</p>}
          {action != null && <div className={part.emptyAction}>{action}</div>}
        </>
      )}
    </td>
  </tr>
));
DataTableEmpty.displayName = "DataTableEmpty";

export { DataTable, DataTableFrame, DataTableStatus, DataTableBar, DataTableMoney, DataTableEmpty };
