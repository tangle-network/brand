import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PDFJS = "pdfjs-dist/legacy/build/pdf.mjs";
const WORKER = "pdfjs-dist/legacy/build/pdf.worker.min.mjs";

/** What the next import of pdf.js yields: a namespace, or a thrown error. */
let pdfjsImport: () => Record<string, unknown>;
let workerImports = 0;

function installedPdfjs() {
  return { getDocument: () => ({}), GlobalWorkerOptions: { workerSrc: "", workerPort: null } };
}

/**
 * Loads the module under test with pdf.js replaced. The loader reads it through
 * a dynamic import, so the substitution happens before the graph is built.
 */
async function loadModule() {
  vi.resetModules();
  vi.doMock(PDFJS, () => pdfjsImport());
  vi.doMock(WORKER, () => {
    workerImports += 1;
    return {};
  });
  return await import("./pdf-loader");
}

let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  pdfjsImport = installedPdfjs;
  workerImports = 0;
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleWarn.mockRestore();
  vi.doUnmock(PDFJS);
  vi.doUnmock(WORKER);
  vi.resetModules();
});

describe("loadPdfjs", () => {
  it("runs the worker on the main thread when no worker URL is configured", async () => {
    const { loadPdfjs } = await loadModule();
    const pdfjs = await loadPdfjs();
    expect(typeof pdfjs.getDocument).toBe("function");
    expect(workerImports).toBe(1);
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe("");
  });

  it("uses the configured worker URL instead of importing the worker", async () => {
    const { configurePdfViewer, loadPdfjs } = await loadModule();
    configurePdfViewer({ workerSrc: "/assets/pdf.worker.min.mjs", assetsUrl: "/pdfjs/" });
    const pdfjs = await loadPdfjs();
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe("/assets/pdf.worker.min.mjs");
    expect(workerImports).toBe(0);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("warns once that scanned pages need assetsUrl", async () => {
    const { loadPdfjs } = await loadModule();
    await loadPdfjs();
    await loadPdfjs();
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn.mock.calls[0][0]).toMatch(/no assetsUrl.*JBIG2, CCITT fax/);
  });

  it("treats a stub without the pdf.js API as missing, for the rest of the session", async () => {
    // What a bundler told to ignore the uninstalled peer hands back.
    pdfjsImport = () => ({ default: {}, getDocument: undefined });
    const { loadPdfjs, isMissingPdfjsError } = await loadModule();
    const first = await loadPdfjs().catch((error: unknown) => error);
    expect(isMissingPdfjsError(first)).toBe(true);
    expect((first as Error).message).toMatch(/Install pdfjs-dist/);

    pdfjsImport = installedPdfjs;
    expect(await loadPdfjs().catch((error: unknown) => error)).toBe(first);
  });

  it("tries again after a failure that is not a missing package", async () => {
    let attempts = 0;
    pdfjsImport = () => {
      attempts += 1;
      if (attempts === 1) throw new Error("Failed to fetch dynamically imported module");
      return installedPdfjs();
    };
    const { loadPdfjs, isMissingPdfjsError } = await loadModule();
    const failure = await loadPdfjs().catch((error: unknown) => error);
    expect(isMissingPdfjsError(failure)).toBe(false);
    await expect(loadPdfjs()).resolves.toHaveProperty("getDocument");
  });
});

describe("asMissingPdfjsError", () => {
  it("names pdfjs-dist only for a resolution failure about it", async () => {
    const { asMissingPdfjsError, isMissingPdfjsError } = await loadModule();
    for (const message of [
      `Failed to resolve import "${PDFJS}". Does the file exist?`,
      `Could not resolve "pdfjs-dist/legacy/build/pdf.mjs"`,
      "Cannot find module 'pdfjs-dist/legacy/build/pdf.mjs'",
    ]) {
      expect(isMissingPdfjsError(asMissingPdfjsError(new Error(message))), message).toBe(true);
    }
    const chunk = new Error("Failed to fetch dynamically imported module");
    expect(asMissingPdfjsError(chunk)).toBe(chunk);
    const other = new Error('Could not resolve "./chunk-abc.js"');
    expect(asMissingPdfjsError(other)).toBe(other);
  });
});

describe("pdfAssetParams", () => {
  it("asks for nothing until assetsUrl is configured", async () => {
    const { pdfAssetParams } = await loadModule();
    expect(pdfAssetParams()).toEqual({});
  });

  it("points every asset directory under an absolute assetsUrl", async () => {
    const { configurePdfViewer, pdfAssetParams } = await loadModule();
    configurePdfViewer({ assetsUrl: "/static/pdfjs" });
    const base = new URL("/static/pdfjs/", document.baseURI).href;
    expect(pdfAssetParams()).toEqual({
      wasmUrl: `${base}wasm/`,
      cMapUrl: `${base}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${base}standard_fonts/`,
      iccUrl: `${base}iccs/`,
    });
  });
});
