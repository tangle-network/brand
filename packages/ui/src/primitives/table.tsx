import { tablePresentation } from "../presentation";
import * as React from "react";
import { cn } from "../lib/utils";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Keep the existing scroll wrapper by default; false returns only the native table. */
  wrapper?: boolean;
  /**
   * Attributes for the wrapper, not the table (ignored when wrapper is false).
   * For an overflowing table, supply tabIndex and an accessible region name.
   * No extra tab stop or unnamed landmark is imposed on every small table.
   */
  wrapperProps?: Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "dangerouslySetInnerHTML">;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, wrapper = true, wrapperProps, ...props }, ref) => {
    const table = (
      <table
        ref={ref}
        className={cn(tablePresentation.root, className)}
        {...props}
      />
    );
    if (!wrapper) return table;

    const { className: wrapperClassName, ...attributes } = wrapperProps ?? {};
    return (
      <div
        {...attributes}
        className={cn(tablePresentation.wrapper, wrapperClassName)}
      >
        {table}
      </div>
    );
  },
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn(tablePresentation.head, className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(tablePresentation.body, className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      tablePresentation.footer,
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      tablePresentation.row,
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      tablePresentation.columnHeader,
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(tablePresentation.cell, className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(tablePresentation.caption, className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
