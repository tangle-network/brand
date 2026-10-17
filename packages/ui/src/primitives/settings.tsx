"use client";

import { CircleAlert, Ellipsis, Lock } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Card, CardFooter, CardTitle } from "./card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { fieldMessageId } from "./field";
import { InfoTip } from "./info-tip";
import { Label } from "./label";

/*
 * Settings rows and lists answer to their section card's width, not the
 * viewport's: the card is the `settings-section` query container, so a card in
 * a phone and one in a narrow split pane stack the same way. Below 34rem a
 * label and a 13rem control no longer fit side by side.
 *
 * Type is one size: 14px for labels, values, descriptions, statuses and
 * errors; section titles are 16px. Controls keep their own `md` size.
 */

const SCROLL_OFFSET = "scroll-mt-[calc(var(--shell-header-height)_+_1rem)]";
const DIVIDED = "not-first:border-t not-first:border-[color:var(--border-subtle)]";
const ERROR_TEXT = "text-[color:var(--surface-danger-text)]";

function ErrorLine({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <div id={id} role="alert" className={cn("flex items-start gap-1.5 text-sm leading-5 [overflow-wrap:anywhere]", ERROR_TEXT, className)}>
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function LockLine({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <div id={id} className={cn("flex items-start gap-1.5 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]", className)}>
      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export type SettingsRowLayout = "inline" | "compact" | "stacked";

export interface SettingsRowProps {
  /** The row's id, for a deep link such as `#timezone`. */
  id?: string;
  label: string;
  /** One line that states a consequence the person needs to act. Most rows need none. */
  description?: React.ReactNode;
  /** Help that explains the setting, shown from an info button beside the label. */
  info?: React.ReactNode;
  /**
   * The control's id. The label targets it, and the row's description, error
   * or lock reason renders at {@link fieldMessageId}. When the row's only child
   * carries this id, the row adds that message to its `aria-describedby` and
   * marks it invalid on error; otherwise point the control there yourself.
   */
  htmlFor?: string;
  /** A save state after the label, such as "Saving…" or "Saved". It is announced politely. */
  status?: React.ReactNode;
  /** Replaces the description in danger text and is announced. */
  error?: React.ReactNode;
  /** Shows a Retry action after the error. */
  onRetry?: () => void;
  /**
   * `inline` (default): text left, control right, stacked below 34rem.
   * `compact`: the control keeps its own width and stays on the line (switches, single buttons).
   * `stacked`: the control spans the row under the text (textareas, lists).
   */
  layout?: SettingsRowLayout;
  /** Why the control is unavailable, naming who can change it. Replaces the description after a lock glyph. */
  disabledReason?: React.ReactNode;
  children?: React.ReactNode;
  "data-testid"?: string;
}

const ROW_COLUMNS: Record<SettingsRowLayout, string> = {
  inline: "grid-cols-[minmax(0,1fr)_minmax(13rem,20rem)] @max-[34rem]/settings-section:grid-cols-1",
  compact: "grid-cols-[minmax(0,1fr)_auto]",
  stacked: "grid-cols-1",
};

const ROW_CONTROL: Record<SettingsRowLayout, string> = {
  inline: "justify-end @max-[34rem]/settings-section:flex-col @max-[34rem]/settings-section:items-stretch",
  compact: "justify-end",
  stacked: "flex-col items-stretch",
};

type DescribableProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: unknown };

/** Point the row's own control at the row's message without changing anything else about it. */
function describeControl(children: React.ReactNode, htmlFor: string | undefined, messageId: string | undefined, invalid: boolean) {
  if (!htmlFor || !messageId || !React.isValidElement<DescribableProps>(children) || children.props.id !== htmlFor) return children;
  const ids = new Set([...(children.props["aria-describedby"] ?? "").split(/\s+/), messageId].filter(Boolean));
  return React.cloneElement(children, {
    "aria-describedby": [...ids].join(" "),
    ...(invalid && children.props["aria-invalid"] === undefined ? { "aria-invalid": true } : {}),
  });
}

/**
 * One setting: its label, an optional consequence line and its control. The
 * label carries the save status after it; an error or a lock reason replaces
 * the description. Rows inside a {@link SettingsSection} are divided by a
 * hairline and stack when the card is narrower than 34rem.
 */
export function SettingsRow({
  id, label, description, info, htmlFor, status, error, onRetry, layout = "inline", disabledReason, children,
  "data-testid": testId,
}: SettingsRowProps) {
  const generatedId = React.useId();
  const messageId = htmlFor ? fieldMessageId(htmlFor) : `${generatedId}-message`;
  const hasMessage = error != null || disabledReason != null || description != null;
  const control = describeControl(children, htmlFor, hasMessage ? messageId : undefined, error != null);
  return (
    <div
      id={id}
      data-testid={testId}
      data-layout={layout}
      className={cn(
        "grid min-w-0 items-center gap-x-8 gap-y-3 px-5 py-4 @max-[34rem]/settings-section:px-4",
        SCROLL_OFFSET,
        DIVIDED,
        ROW_COLUMNS[layout],
      )}
    >
      <div className="min-w-0">
        <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
          {htmlFor
            ? <Label htmlFor={htmlFor} className="leading-5 text-foreground">{label}</Label>
            : <span className="font-medium text-sm leading-5 text-foreground">{label}</span>}
          {info != null && <InfoTip label={label}>{info}</InfoTip>}
          <span aria-live="polite" className="inline-flex items-center gap-1 text-sm leading-5 text-muted-foreground">{status}</span>
        </div>
        {error != null
          ? <ErrorLine id={messageId} className="mt-0.5">
            {error}
            {onRetry && <>{" "}<Button type="button" variant="bare" onClick={onRetry} className="rounded-sm font-medium text-[var(--accent-text)] underline-offset-4 hover:underline">Retry</Button></>}
          </ErrorLine>
          : disabledReason != null
            ? <LockLine id={messageId} className="mt-0.5">{disabledReason}</LockLine>
            : description != null && (
              <div id={messageId} className="mt-0.5 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{description}</div>
            )}
      </div>
      {control != null && control !== false && (
        <div className={cn("flex min-w-0 items-center gap-2", ROW_CONTROL[layout])}>{control}</div>
      )}
    </div>
  );
}

export interface SettingsSectionProps {
  /** The section's anchor: `#id` scrolls to it. The title's id is `${id}-title`. */
  id: string;
  title: string;
  /** One short line, at most about twelve words. Leave it out when the title says enough. */
  description?: React.ReactNode;
  /** Help that explains the section, shown from an info button beside the title. */
  info?: React.ReactNode;
  /** Section actions, top right, such as "Edit brief" or "Add source". */
  actions?: React.ReactNode;
  /** `danger` draws the card's edge and title in the danger tone. */
  tone?: "default" | "danger";
  /** The card's footer on the muted plane, such as the one save bar a section may have. */
  footer?: React.ReactNode;
  /** Rows, lists and any other blocks of the section. */
  children?: React.ReactNode;
  "data-testid"?: string;
}

/**
 * One settings card: a 16px title with optional description, info tip and
 * actions, then its rows and lists, then an optional footer. The card is the
 * width container its rows and lists respond to.
 */
export function SettingsSection({
  id, title, description, info, actions, tone = "default", footer, children, "data-testid": testId,
}: SettingsSectionProps) {
  const titleId = `${id}-title`;
  const danger = tone === "danger";
  return (
    <Card
      id={id}
      role="region"
      aria-labelledby={titleId}
      data-testid={testId}
      data-tone={tone}
      className={cn("@container/settings-section min-w-0", SCROLL_OFFSET, danger && "border-[color:var(--surface-danger-border)]")}
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4 @max-[34rem]/settings-section:flex-wrap @max-[34rem]/settings-section:px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <CardTitle as="h2" id={titleId} className={cn("leading-6 [overflow-wrap:anywhere]", danger && ERROR_TEXT)}>{title}</CardTitle>
            {info != null && <InfoTip label={title}>{info}</InfoTip>}
          </div>
          {description != null && (
            <div className="mt-0.5 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{description}</div>
          )}
        </div>
        {actions != null && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
      {footer != null && (
        <CardFooter className="justify-between gap-3 rounded-b-[inherit] border-t border-[color:var(--border-subtle)] bg-muted px-5 py-3 text-sm leading-5 [&:not(:first-child)]:pt-3 @max-[34rem]/settings-section:px-4">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

/** Track widths for a {@link SettingsList}. Each slot an item uses needs its column. */
export interface SettingsListColumns {
  /** A logo or avatar column, such as `"36px"`. */
  leading?: string;
  /** The title column; `minmax(0,1fr)` by default. */
  main?: string;
  /** A fixed state column, such as `"8rem"`. Below 34rem the state moves under the title, full width. */
  status?: string;
  /** A fixed column for row actions, such as `"11rem"`. Below 34rem it shrinks to its content. */
  actions?: string;
  /** A column for the ⋯ menu, such as `"36px"`. Without it the menu ends the actions cell. */
  menu?: string;
}

const LIST_SLOTS = ["leading", "main", "status", "actions", "menu"] as const;

const LENGTH = /^[\d.]+(?:px|rem|em|ch)$/;

function listTracks(columns: SettingsListColumns, narrow: boolean) {
  const tracks = LIST_SLOTS.flatMap((slot): Array<[string, string]> => {
    if (slot === "main") return [[slot, columns.main ?? "minmax(0,1fr)"]];
    const width = columns[slot];
    if (!width || (narrow && slot === "status")) return [];
    return [[slot, narrow && slot === "actions" ? "auto" : width]];
  });
  // A subgrid item's inline padding (px-5, px-4 when narrow) lands on its edge
  // cells as extra margin, so a fixed edge track grows by it to keep its width.
  const pad = narrow ? "1rem" : "1.25rem";
  return tracks.map(([slot, width], index) => {
    const edge = index === 0 || index === tracks.length - 1;
    return `[${slot}] ${edge && LENGTH.test(width) ? `calc(${width} + ${pad})` : width}`;
  }).join(" ");
}

const SettingsListContext = React.createContext<SettingsListColumns>({});

export interface SettingsListProps {
  columns: SettingsListColumns;
  "aria-label"?: string;
  children?: React.ReactNode;
  "data-testid"?: string;
}

/**
 * Comparable rows whose status and action columns line up across items (CSS
 * subgrid). Below 34rem each item becomes two lines: the title and meta with
 * actions on the right, then the state under them at full width.
 */
export function SettingsList({ columns, children, "aria-label": ariaLabel, "data-testid": testId }: SettingsListProps) {
  const style = {
    "--settings-list-columns": listTracks(columns, false),
    "--settings-list-columns-narrow": listTracks(columns, true),
  } as React.CSSProperties;
  return (
    <SettingsListContext.Provider value={columns}>
      <ul
        role="list"
        aria-label={ariaLabel}
        data-testid={testId}
        style={style}
        className={cn(
          "grid min-w-0 gap-x-4 [grid-template-columns:var(--settings-list-columns)] @max-[34rem]/settings-section:[grid-template-columns:var(--settings-list-columns-narrow)]",
          DIVIDED,
        )}
      >
        {children}
      </ul>
    </SettingsListContext.Provider>
  );
}

export interface SettingsListMenuItem {
  label: string;
  onSelect: () => void;
  /** Destructive actions (delete, remove, revoke) belong here, in the danger tone. */
  tone?: "danger";
  /** Shown under the label; the item stays focusable so the reason is read, and selecting it does nothing. */
  disabledReason?: React.ReactNode;
}

export interface SettingsListItemProps {
  /** A logo or avatar, in the list's `leading` column. */
  leading?: React.ReactNode;
  /** The item's name. Make it the link to the item's detail. */
  title: React.ReactNode;
  /** One line under the title, such as an address or a schedule. */
  meta?: React.ReactNode;
  /** The item's state, or a control that sets it (a role select). */
  status?: React.ReactNode;
  /** Shown under the meta in danger text and announced. */
  error?: React.ReactNode;
  /** The one verb the item needs at rest, as ghost buttons. */
  actions?: React.ReactNode;
  /** Everything else, including destructive actions, behind a ⋯ button. */
  menu?: SettingsListMenuItem[];
  "data-testid"?: string;
}

function ItemMenu({ items, titleId }: { items: SettingsListMenuItem[]; titleId: string }) {
  const triggerId = React.useId();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" id={triggerId} aria-label="More actions" aria-labelledby={`${triggerId} ${titleId}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 max-w-72">
        {items.map((item) => {
          const unavailable = item.disabledReason != null;
          return (
            <DropdownMenuItem
              key={item.label}
              aria-disabled={unavailable || undefined}
              onSelect={(event) => { if (unavailable) event.preventDefault(); else item.onSelect(); }}
              className={cn(
                "flex-col items-start gap-0.5 leading-5",
                item.tone === "danger" && !unavailable && cn(ERROR_TEXT, "focus:text-[color:var(--surface-danger-text)]"),
                unavailable && "cursor-not-allowed text-muted-foreground focus:text-muted-foreground",
              )}
            >
              <span>{item.label}</span>
              {unavailable && <LockLine>{item.disabledReason}</LockLine>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Below 34rem the state takes a second line from the title to the card edge, so a role select gets the full width.
const NARROW_STATUS = "@max-[34rem]/settings-section:col-start-[main] @max-[34rem]/settings-section:col-end-[-1] @max-[34rem]/settings-section:row-start-2 @max-[34rem]/settings-section:mt-2";

/** One item in a {@link SettingsList}. Slots go to the list's columns; a slot without a column flows into the title cell. */
export function SettingsListItem({ leading, title, meta, status, error, actions, menu, "data-testid": testId }: SettingsListItemProps) {
  const columns = React.useContext(SettingsListContext);
  const titleId = React.useId();
  const menuNode = menu && menu.length > 0 ? <ItemMenu items={menu} titleId={titleId} /> : null;
  const actionCell = (actions != null || (menuNode && !columns.menu)) && (
    <>{actions}{!columns.menu && menuNode}</>
  );
  const titleNode = (
    <div
      id={titleId}
      className="min-w-0 font-medium text-sm leading-5 text-foreground [overflow-wrap:anywhere] [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline-offset-4 [&_a:hover]:underline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[var(--focus-border)]"
    >
      {title}
    </div>
  );
  return (
    <li
      data-testid={testId}
      className={cn(
        "col-span-full grid grid-cols-subgrid items-center px-5 py-3 @max-[34rem]/settings-section:px-4",
        DIVIDED,
      )}
    >
      {leading != null && columns.leading && <div className="col-start-[leading] row-start-1 flex">{leading}</div>}
      <div className="col-start-[main] row-start-1 min-w-0">
        {leading != null && !columns.leading
          ? <div className="flex min-w-0 items-center gap-3">{leading}{titleNode}</div>
          : titleNode}
        {meta != null && <div className="text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{meta}</div>}
        {error != null && <ErrorLine className="mt-1">{error}</ErrorLine>}
        {status != null && !columns.status && <div className="mt-1 text-sm leading-5 text-muted-foreground">{status}</div>}
        {actionCell && !columns.actions && <div className="mt-2 flex flex-wrap items-center gap-1">{actionCell}</div>}
      </div>
      {status != null && columns.status && (
        <div className={cn("col-start-[status] row-start-1 min-w-0 text-sm leading-5 text-muted-foreground", NARROW_STATUS)}>{status}</div>
      )}
      {actionCell && columns.actions && (
        <div className="col-start-[actions] row-start-1 flex min-w-0 items-center justify-end gap-1">{actionCell}</div>
      )}
      {menuNode && columns.menu && <div className="col-start-[menu] row-start-1 flex justify-end">{menuNode}</div>}
    </li>
  );
}
