/**
 * Markdown read as plain text, for a one-line preview: code fences, emphasis,
 * headings, list and quote markers, and link syntax are removed, so a preview
 * never shows `**` or `#`. Underscores inside words (`snake_case`) are kept.
 */
export function plainTextFromMarkdown(text: string): string {
  return text
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]{0,3}(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/gm, "")
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "$2")
    .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?![\w*])/g, "$1$2")
    .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, "$1$2")
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "$1");
}

/** Truncate text to `max` characters, appending "..." if truncated. */
export function truncateText(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max).trim() + "...";
}

/**
 * Format a byte count using binary units (KiB/MiB/GiB, surfaced as
 * "KB/MB/GB" for readability). KB and MB use one decimal below 10 and
 * round above; GB keeps two decimals below 10 so half-GB changes stay
 * visible on memory dashboards, and drops to one decimal above.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  const gb = mb / 1024;
  return `${gb < 10 ? gb.toFixed(2) : gb.toFixed(1)} GB`;
}

export function formatAxisDuration(ms: number): string {
  if (ms >= 86_400_000) { const days = Math.floor(ms / 86_400_000), hours = Math.floor(ms % 86_400_000 / 3_600_000); return `${days}d${hours ? ` ${hours}h` : ''}`; }
  const s = ms / 1000;
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) return `${(s / 60).toFixed(1)} min`;
  return `${(s / 3600).toFixed(1)} h`;
}

export const formatCompact = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value) ? '—' : new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

/** Span milliseconds, tenths below ten seconds, then seconds/minutes; days stay compact. */
export function formatSpanDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const precision = ms < 10_000 ? 100 : ms < 3_600_000 ? 1000 : 60_000
  return ms >= 86_400_000 ? formatAxisDuration(ms) : ms < 1000 ? `${Math.round(ms)}ms` : formatClock(Math.round(ms / precision) * precision)
}

/** $0.12, $0.005, $12.40; never rounds a recorded nonzero cost to $0.00. */
export function formatCost(usd: number): string {
  if (!Number.isFinite(usd) || usd < 0) return '—'
  if (usd === 0) return '$0.00'
  if (usd < 0.01) return `$${usd.toPrecision(1)}`
  return `$${usd.toFixed(2)}`
}

/** 9.8k, 754.4k, 1.2M with the exact count left to a title. */
export function formatCount(n: number): string {
  return !Number.isSafeInteger(n) || n < 0 ? '—' : formatCompact(n)
}

/** Elapsed clock at millisecond precision, so zoomed axis ticks keep distinct labels. */
export function formatClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const seconds = Math.round(ms) / 1000
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60), rest = Number((seconds % 60).toFixed(3))
  return [hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', rest ? `${rest}s` : ''].filter(Boolean).join(' ') || '0s'
}

/** Normalize labels to UTC without rewriting the source timestamp. */
export function formatUtcTime(value: string | Date, includeDate = false) {
  const date = typeof value === "string" ? new Date(value) : value
  if (!Number.isFinite(date.valueOf())) return 'Unknown time'
  const iso = date.toISOString()
  return `${includeDate ? iso.slice(0, 19).replace('T', ' ') : iso.slice(11, 19)} UTC`
}

// Existing names share the canonical duration implementation.
export { formatSpanDuration as formatDuration, formatSpanDuration as formatUptime };
