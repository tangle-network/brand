/**
 * Loads pdf.js for `PdfViewer`, which renders PDF pages to canvas in every
 * browser, including Android Chrome and iOS Safari, where `<object>` shows a
 * blank frame or only the first page.
 *
 * `pdfjs-dist` is an optional peer, reached only through the dynamic imports
 * below, for the reasons `editor/editor-peers.ts` gives: a static import fails
 * the build of every consumer that does not install it, and esbuild defers an
 * unresolved `import()` to run time only when the call carries a `.catch()`.
 * `scripts/validate-dist.mjs` enforces both.
 *
 * The legacy build is deliberate. The modern build calls APIs such as
 * `Map.prototype.getOrInsertComputed` without a fallback, so it throws on
 * phone browsers a year or two old; the legacy build carries polyfills for
 * them at about 60 KB more minified code. The worker comes from the same
 * build, because pdf.js refuses a worker whose version differs from its own.
 *
 * Worker. pdf.js parses documents in a worker named by `workerSrc`. No
 * bundler-neutral expression yields that URL from inside a library, and the
 * pdf.js default fetches from a CDN, so by default this module imports the
 * worker module itself. pdf.js then runs its worker code on the main thread,
 * which works in Vite, esbuild, webpack and Cloudflare Workers builds with no
 * configuration and no third-party fetch. Parsing a large document then
 * competes with scrolling, so production apps should serve the worker file and
 * pass its URL to `configurePdfViewer` before the first viewer renders. With
 * Vite:
 *
 *   import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
 *   configurePdfViewer({ workerSrc });
 *
 * The setting is page-wide because pdf.js's own worker setting is: once the
 * main-thread worker is loaded, every document on the page uses it.
 *
 * Assets. pdf.js 6 decodes JBIG2, CCITT fax and JPEG 2000 images with
 * WebAssembly modules it fetches at run time; black-and-white scans use the
 * first two. Without `assetsUrl` those images do not render, and pdf.js warns
 * only in the console, so this module warns once when it loads without one.
 */

import type * as Pdfjs from "pdfjs-dist";
import { isMissingPeerError, rethrow } from "../lib/optional-peer";

export type PdfjsLib = typeof Pdfjs;

export interface PdfViewerConfig {
  /**
   * URL of `pdfjs-dist/legacy/build/pdf.worker.min.mjs` from the installed
   * pdfjs-dist, served by the app. Moves PDF parsing off the main thread.
   */
  workerSrc?: string;
  /**
   * Base URL, ending in `/`, under which the app serves the `wasm/`, `cmaps/`,
   * `standard_fonts/` and `iccs/` directories of the installed pdfjs-dist.
   * Needed for scanned pages, CJK text and non-embedded fonts.
   */
  assetsUrl?: string;
}

let config: PdfViewerConfig = {};

/**
 * Sets the page-wide pdf.js worker and asset locations. Call it once, before
 * the first `PdfViewer` renders; a worker set afterwards applies only when no
 * document has loaded the main-thread worker yet.
 */
export function configurePdfViewer(next: PdfViewerConfig): void {
  config = { ...next };
}

/**
 * The optional peer behind `PdfViewer`. `scripts/validate-dist.mjs` reads this
 * list and requires every import of it to be dynamic and caught.
 */
const DEFERRED_PEERS = ["pdfjs-dist"];

/** pdfjs-dist is absent, or resolved to a stub with none of its API. */
export class MissingPdfjsError extends Error {
  constructor(options?: { cause?: unknown }) {
    super(
      "PdfViewer needs the optional peer pdfjs-dist. Install pdfjs-dist to render PDF pages.",
      options,
    );
    this.name = "MissingPdfjsError";
  }
}

export function isMissingPdfjsError(error: unknown): boolean {
  return error instanceof Error && error.name === "MissingPdfjsError";
}

/**
 * Turns a resolution failure that names pdfjs-dist into `MissingPdfjsError`.
 * Any other rejection, such as a chunk that did not download, passes through.
 */
export function asMissingPdfjsError(error: unknown): unknown {
  if (!isMissingPeerError(error)) return error;
  const message = (error as Error).message;
  return DEFERRED_PEERS.some((name) => message.includes(name))
    ? new MissingPdfjsError({ cause: error })
    : error;
}

async function importPdfjs(): Promise<PdfjsLib> {
  let pdfjs: PdfjsLib;
  try {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs").catch(rethrow);
  } catch (error) {
    throw asMissingPdfjsError(error);
  }
  // A bundler told to ignore the missing peer can hand back an empty module.
  if (typeof pdfjs.getDocument !== "function") throw new MissingPdfjsError();
  return pdfjs;
}

let pending: Promise<PdfjsLib> | null = null;
let warnedAboutAssets = false;

/**
 * Resolves pdf.js with its worker configured. A missing peer stays missing for
 * the session, so its rejection is kept; any other failure, such as a chunk
 * that did not download, is dropped so the next viewer tries again.
 */
export function loadPdfjs(): Promise<PdfjsLib> {
  pending ??= importPdfjs().catch((error: unknown) => {
    if (!isMissingPdfjsError(error)) pending = null;
    throw error;
  });
  return pending.then(async (pdfjs) => {
    const { GlobalWorkerOptions } = pdfjs;
    if (config.workerSrc) {
      GlobalWorkerOptions.workerSrc = config.workerSrc;
    } else if (!GlobalWorkerOptions.workerSrc && !GlobalWorkerOptions.workerPort) {
      // Defines `globalThis.pdfjsWorker`, which pdf.js runs on this thread.
      await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs").catch(rethrow);
    }
    if (!config.assetsUrl && !warnedAboutAssets) {
      warnedAboutAssets = true;
      console.warn(
        "PdfViewer: no assetsUrl is configured, so JBIG2, CCITT fax and JPEG 2000 images " +
          "(most black-and-white scans) will not render. See configurePdfViewer.",
      );
    }
    return pdfjs;
  });
}

/** The `getDocument` options that locate pdf.js's run-time assets. */
export interface PdfAssetParams {
  wasmUrl?: string;
  cMapUrl?: string;
  cMapPacked?: boolean;
  standardFontDataUrl?: string;
  iccUrl?: string;
}

/** `getDocument` asset options for the configured `assetsUrl`, or none. */
export function pdfAssetParams(): PdfAssetParams {
  if (!config.assetsUrl) return {};
  // pdf.js joins file names onto these with plain concatenation, and a
  // worker resolves a relative URL against its own script, so make it absolute.
  const base = new URL(config.assetsUrl, document.baseURI).href.replace(/\/?$/, "/");
  return {
    wasmUrl: `${base}wasm/`,
    cMapUrl: `${base}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}standard_fonts/`,
    iccUrl: `${base}iccs/`,
  };
}
