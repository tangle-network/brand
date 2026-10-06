/**
 * PdfViewer — renders a PDF's pages to canvas with pdf.js, so a document reads
 * the same in every browser, phones included. A continuous column of pages
 * with page navigation, zoom and fit-to-width, and Download.
 *
 * Only pages within a screen of the visible area hold a canvas; the rest keep
 * their size and release theirs, so a long document stays inside the canvas
 * memory a phone allows.
 *
 * When pdf.js is not installed or cannot open the file, the viewer says so
 * and falls back to the browser's own viewer through `<object>`, and from
 * there to a FileCard where the browser has none (Android Chrome).
 */

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  LoaderCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { fieldPresentation } from "../lib/control-presentation";
import { focusRingInset } from "../lib/focus";
import { cn } from "../lib/utils";
import { Alert, AlertDescription } from "../primitives/alert";
import { Button } from "../primitives/button";
import { FileCard } from "./file-card";
import { isMissingPdfjsError, loadPdfjs, pdfAssetParams } from "./pdf-loader";

export interface PdfViewerProps {
  /**
   * The PDF: an object URL, a data URL, or an http(s) URL. A URL on another
   * origin must allow this one through CORS; when it does not, the viewer
   * falls back to the browser's viewer.
   */
  src: string;
  /** Names the document for assistive technology and the fallback card. */
  filename?: string;
  /** Size in bytes, shown on the fallback card. */
  size?: number;
  /** Adds a Download button to the toolbar and the fallback card. */
  onDownload?: () => void;
  /** Give the viewer a height; it scrolls its pages inside it. */
  className?: string;
}

/** pdf.js measures in points; CSS pixels are 96 to the inch. */
const PDF_TO_CSS = 96 / 72;
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const MIN_ZOOM = ZOOM_STEPS[0];
const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];
/** Matches the column's `p-3`. */
const COLUMN_PADDING = 12;
/**
 * iOS Safari refuses to draw a canvas above 4096 × 4096 pixels. Past that, a
 * page renders below the device pixel ratio, softer but whole.
 */
const MAX_CANVAS_PIXELS = 4096 * 4096;

type ZoomSetting = { mode: "fit" } | { mode: "manual"; value: number };

type LoadState =
  | { status: "loading"; percent?: number }
  | { status: "ready"; doc: PDFDocumentProxy }
  | { status: "fallback"; notice: string; retry: boolean };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * pdf.js streams an http(s) URL itself, with range requests, so the first
 * page shows before a long file finishes downloading. It reads other URLs
 * through XMLHttpRequest, which not every browser allows for a data URL, so
 * those are read here and handed over as bytes.
 */
async function documentSource(
  src: string,
  signal: AbortSignal,
): Promise<{ url: string } | { data: Uint8Array }> {
  if (/^https?:/i.test(new URL(src, document.baseURI).protocol)) return { url: src };
  const response = await fetch(src, { signal });
  if (!response.ok) throw new Error(`Reading the PDF failed with status ${response.status}.`);
  return { data: new Uint8Array(await response.arrayBuffer()) };
}

/** What the reader is told when the viewer falls back, and whether retrying can help. */
function fallbackFor(error: unknown): { notice: string; retry: boolean } {
  if (isMissingPdfjsError(error)) {
    return {
      notice: "This is the browser's PDF viewer, because this app does not include the page viewer.",
      retry: false,
    };
  }
  const name = error instanceof Error ? error.name : "";
  if (name === "PasswordException") {
    return {
      notice: "This PDF is password-protected, so it opens in the browser's PDF viewer.",
      retry: false,
    };
  }
  if (name === "InvalidPDFException") {
    return { notice: "This file could not be read as a PDF.", retry: false };
  }
  const status = (error as { status?: unknown } | null)?.status;
  if (name === "ResponseException" && typeof status === "number" && status > 0) {
    return { notice: `The PDF could not be downloaded (HTTP ${status}).`, retry: true };
  }
  return {
    notice: "The page viewer could not open this PDF, so this is the browser's PDF viewer.",
    retry: true,
  };
}

export function PdfViewer({
  src,
  filename = "Document",
  size,
  onDownload,
  className,
}: PdfViewerProps) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let destroy: (() => Promise<void>) | undefined;
    const abort = new AbortController();
    setState({ status: "loading" });

    const fail = (error: unknown) => {
      if (!active) return;
      // The notice tells the reader; this tells the developer why.
      console.error(`PdfViewer: falling back to the browser's PDF viewer for ${filename}.`, error);
      setState({ status: "fallback", ...fallbackFor(error) });
    };

    (async () => {
      const pdfjs = await loadPdfjs();
      const source = await documentSource(src, abort.signal);
      if (!active) return;
      const task = pdfjs.getDocument({ ...source, ...pdfAssetParams() });
      destroy = () => task.destroy();
      task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
        if (active && total > 0) {
          setState({ status: "loading", percent: Math.min(100, Math.round((loaded / total) * 100)) });
        }
      };
      const doc = await task.promise;
      if (active) setState({ status: "ready", doc });
    })().catch(fail);

    return () => {
      active = false;
      abort.abort();
      // Destroying the task also destroys a document it already opened.
      void destroy?.();
    };
    // `filename` only labels the log line; a rename must not reload the file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, attempt]);

  return (
    <div
      data-state={state.status}
      className={cn(
        "flex max-h-[100dvh] min-h-0 flex-col overflow-hidden rounded-[var(--radius-md)] border border-border bg-card",
        className,
      )}
    >
      {state.status === "ready" ? (
        <PdfDocument doc={state.doc} filename={filename} onDownload={onDownload} />
      ) : state.status === "loading" ? (
        <div
          role="status"
          className="flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
          <span>
            Loading {filename}
            {state.percent === undefined ? "…" : ` · ${state.percent}%`}
          </span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
          <Alert tone="info" icon={<Info />}>
            <AlertDescription>{state.notice}</AlertDescription>
            {state.retry && (
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
                  Try again
                </Button>
              </div>
            )}
          </Alert>
          {/* A browser with a PDF viewer shows the file here; one without
              (Android Chrome) shows the card. */}
          <object
            data={src}
            type="application/pdf"
            title={filename}
            className="min-h-[20rem] w-full flex-1 rounded-[var(--radius-md)]"
          >
            <FileCard
              filename={filename}
              mimeType="application/pdf"
              size={size}
              description="This browser does not show PDFs inline."
              onDownload={onDownload}
              className="h-full"
            />
          </object>
        </div>
      )}
    </div>
  );
}

function PdfDocument({
  doc,
  filename,
  onDownload,
}: {
  doc: PDFDocumentProxy;
  filename: string;
  onDownload?: () => void;
}) {
  const pageCount = doc.numPages;
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const pageElements = useRef<(HTMLDivElement | null)[]>([]);
  // Page 1 at 100%, in CSS pixels. Every page takes this size until its own
  // loads, and fit-to-width fits it.
  const [firstPage, setFirstPage] = useState<{ width: number; height: number } | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [zoomSetting, setZoomSetting] = useState<ZoomSetting>({ mode: "fit" });
  const [currentPage, setCurrentPage] = useState(1);
  // The reading position as a page and a fraction of its height, so a zoom
  // or a resize keeps the same text in view. Null until the reader scrolls.
  const anchor = useRef<{ index: number; fraction: number } | null>(null);
  const registerPage = useCallback((pageNumber: number, element: HTMLDivElement | null) => {
    pageElements.current[pageNumber - 1] = element;
  }, []);

  useEffect(() => {
    let active = true;
    doc.getPage(1).then(
      (page) => {
        if (!active) return;
        const { width, height } = page.getViewport({ scale: PDF_TO_CSS });
        setFirstPage({ width, height });
      },
      () => {
        // A first page that will not load still leaves the others readable.
        if (active) setFirstPage({ width: 612 * PDF_TO_CSS, height: 792 * PDF_TO_CSS });
      },
    );
    return () => {
      active = false;
    };
  }, [doc]);

  useLayoutEffect(() => {
    if (!scroller) return;
    setAvailableWidth(scroller.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setAvailableWidth(scroller.clientWidth));
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [scroller]);

  const fitZoom =
    firstPage && availableWidth > COLUMN_PADDING * 2
      ? clamp((availableWidth - COLUMN_PADDING * 2) / firstPage.width, MIN_ZOOM, MAX_ZOOM)
      : 1;
  const zoom = zoomSetting.mode === "fit" ? fitZoom : zoomSetting.value;

  const readPosition = useCallback(() => {
    if (!scroller) return;
    const top = scroller.scrollTop;
    const bottom = top + scroller.clientHeight;
    // The page with the most height on screen is the current one, except at
    // either end, where the first or last page cannot scroll to the top.
    let best = 0;
    let bestVisible = -1;
    pageElements.current.forEach((element, index) => {
      if (!element) return;
      const visible =
        Math.min(bottom, element.offsetTop + element.offsetHeight) - Math.max(top, element.offsetTop);
      if (visible > bestVisible) {
        best = index;
        bestVisible = visible;
      }
    });
    if (top + scroller.clientHeight >= scroller.scrollHeight - 1 && top > 0) best = pageCount - 1;
    const element = pageElements.current[best];
    anchor.current = {
      index: best,
      fraction: element?.offsetHeight ? (top - element.offsetTop) / element.offsetHeight : 0,
    };
    setCurrentPage(best + 1);
  }, [scroller, pageCount]);

  // Restore the reading position after the page sizes change.
  useLayoutEffect(() => {
    const element = anchor.current && pageElements.current[anchor.current.index];
    if (!scroller || !anchor.current || !element) return;
    scroller.scrollTop = element.offsetTop + anchor.current.fraction * element.offsetHeight;
    scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  }, [scroller, zoom]);

  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const onScroll = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      readPosition();
    });
  };

  const goToPage = (pageNumber: number) => {
    const target = clamp(pageNumber, 1, pageCount);
    const element = pageElements.current[target - 1];
    if (scroller && element) {
      scroller.scrollTop = element.offsetTop - COLUMN_PADDING;
      anchor.current = {
        index: target - 1,
        fraction: element.offsetHeight ? -COLUMN_PADDING / element.offsetHeight : 0,
      };
    }
    setCurrentPage(target);
  };

  const zoomBy = (direction: 1 | -1) => {
    readPosition();
    const next =
      direction > 0
        ? ZOOM_STEPS.find((step) => step > zoom + 0.001) ?? MAX_ZOOM
        : [...ZOOM_STEPS].reverse().find((step) => step < zoom - 0.001) ?? MIN_ZOOM;
    setZoomSetting({ mode: "manual", value: next });
  };

  const percent = Math.round(zoom * 100);
  const fitting = zoomSetting.mode === "fit";

  return (
    <>
      <div
        role="group"
        aria-label={`${filename} controls`}
        // Fits one row at 360px with a three-digit page count. Narrower than
        // that it scrolls, because a squeezed button is a missed tap.
        className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border px-1 py-1 [&>*]:shrink-0"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          title="Previous page"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          <ChevronLeft />
        </Button>
        <PageField current={currentPage} total={pageCount} onCommit={goToPage} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next page"
          title="Next page"
          disabled={currentPage >= pageCount}
          onClick={() => goToPage(currentPage + 1)}
        >
          <ChevronRight />
        </Button>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={zoom <= MIN_ZOOM + 0.001}
            onClick={() => zoomBy(-1)}
          >
            <ZoomOut />
          </Button>
          {/* The zoom level doubles as the fit-to-width control, which keeps
              the toolbar to one row at 360px. Pressed while fitting. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${percent}%, fit to width`}
            title="Fit to width"
            aria-pressed={fitting}
            className={cn(
              "min-w-12 px-1.5 tabular-nums",
              fitting && "bg-primary/10 text-[var(--accent-text)] hover:text-[var(--accent-text)]",
            )}
            onClick={() => {
              readPosition();
              setZoomSetting({ mode: "fit" });
            }}
          >
            {percent}%
          </Button>
          <span className="sr-only" aria-live="polite">
            Zoom {percent}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            title="Zoom in"
            disabled={zoom >= MAX_ZOOM - 0.001}
            onClick={() => zoomBy(1)}
          >
            <ZoomIn />
          </Button>
          {onDownload && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Download ${filename}`}
              title="Download"
              onClick={onDownload}
            >
              <Download />
            </Button>
          )}
        </div>
      </div>
      <div
        ref={setScroller}
        tabIndex={0}
        role="region"
        aria-label={filename}
        onScroll={onScroll}
        // A stable gutter keeps fit-to-width from oscillating as the
        // scrollbar appears and narrows the column it was fitted to.
        className={cn(
          "relative min-h-0 flex-1 overflow-auto overscroll-contain bg-muted [scrollbar-gutter:stable]",
          focusRingInset,
        )}
      >
        {firstPage ? (
          <div className="flex w-max min-w-full flex-col items-center gap-3 p-3">
            {Array.from({ length: pageCount }, (_, index) => (
              <PdfPage
                key={index}
                doc={doc}
                pageNumber={index + 1}
                pageCount={pageCount}
                zoom={zoom}
                placeholder={firstPage}
                root={scroller}
                register={registerPage}
              />
            ))}
          </div>
        ) : (
          <div role="status" className="flex h-full min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
            <span className="sr-only">Loading {filename}…</span>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The current page number, editable. A typed number applies on Enter or when
 * the field loses focus; Escape restores the current page.
 */
function PageField({
  current,
  total,
  onCommit,
}: {
  current: number;
  total: number;
  onCommit: (page: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const page = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(page)) onCommit(page);
  };
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Page, 1 to ${total}`}
        value={draft ?? String(current)}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => setDraft(event.currentTarget.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setDraft(null);
        }}
        // 16px on phones: iOS zooms the whole page into a smaller field.
        className={cn(
          fieldPresentation,
          "h-8 w-11 rounded-md border px-1 text-center text-base tabular-nums sm:text-sm",
        )}
      />
      <span aria-hidden="true" className="whitespace-nowrap tabular-nums">
        / {total}
      </span>
    </span>
  );
}

function releaseCanvases(host: HTMLElement) {
  // Zeroing the size frees the bitmap now; iOS otherwise holds it until
  // garbage collection and stops drawing canvases once its budget is spent.
  for (const canvas of host.querySelectorAll("canvas")) {
    canvas.width = 0;
    canvas.height = 0;
  }
  host.replaceChildren();
}

const PdfPage = memo(function PdfPage({
  doc,
  pageNumber,
  pageCount,
  zoom,
  placeholder,
  root,
  register,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  pageCount: number;
  zoom: number;
  placeholder: { width: number; height: number };
  root: HTMLElement | null;
  register: (pageNumber: number, element: HTMLDivElement | null) => void;
}) {
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const scale = zoom * PDF_TO_CSS;

  useEffect(() => {
    let active = true;
    doc.getPage(pageNumber).then(
      (loaded) => active && setPage(loaded),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [doc, pageNumber]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    // One screen above and below the visible area renders ahead of a scroll.
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry?.isIntersecting ?? false),
      { root, rootMargin: "100% 0px" },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !page) return;
    if (!near) {
      releaseCanvases(host);
      page.cleanup();
      return;
    }
    const viewport = page.getViewport({ scale });
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height)),
    );
    // Draw into a new canvas and swap it in when complete, so a zoom shows the
    // previous rendering stretched rather than a blank page.
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
    canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
    canvas.style.cssText = "display:block;width:100%;height:100%";
    canvas.setAttribute("aria-hidden", "true");
    const task = page.render({
      canvas,
      viewport,
      transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
    });
    let finished = false;
    task.promise.then(
      () => {
        finished = true;
        releaseCanvases(host);
        host.append(canvas);
        setFailed(false);
      },
      (error: unknown) => {
        finished = true;
        canvas.width = 0;
        canvas.height = 0;
        if ((error as Error | null)?.name !== "RenderingCancelledException") setFailed(true);
      },
    );
    return () => {
      if (!finished) task.cancel();
    };
  }, [page, near, scale]);

  useEffect(() => {
    const host = hostRef.current;
    return () => {
      if (host) releaseCanvases(host);
    };
  }, []);

  const box = useMemo(() => {
    if (page) {
      const { width, height } = page.getViewport({ scale });
      return { width, height };
    }
    return { width: placeholder.width * zoom, height: placeholder.height * zoom };
  }, [page, scale, zoom, placeholder]);

  return (
    <div
      ref={(element) => {
        boxRef.current = element;
        register(pageNumber, element);
      }}
      role="img"
      aria-label={`Page ${pageNumber} of ${pageCount}`}
      data-page-number={pageNumber}
      style={{ width: Math.round(box.width), height: Math.round(box.height) }}
      className="relative shrink-0 overflow-hidden bg-card shadow-sm ring-1 ring-border"
    >
      <div ref={hostRef} className="absolute inset-0" />
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
          Page {pageNumber} could not be displayed.
        </p>
      )}
    </div>
  );
});
