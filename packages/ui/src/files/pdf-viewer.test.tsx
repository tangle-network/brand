import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MissingPdfjsError, loadPdfjs, type PdfjsLib } from "./pdf-loader";
import { PdfViewer } from "./pdf-viewer";

vi.mock("./pdf-loader", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./pdf-loader")>()),
  loadPdfjs: vi.fn(),
}));

const BLOB_URL = "blob:https://app.tangle.tools/9a8b7c";
/** US Letter in points. */
const LETTER = { width: 612, height: 792 };
const CSS_PER_POINT = 96 / 72;

/** A pdf.js stand-in: pages of US Letter that render at once. */
function fakePdfjs({ numPages = 3, fail }: { numPages?: number; fail?: Error } = {}) {
  const render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({
      width: LETTER.width * scale,
      height: LETTER.height * scale,
    }),
    render,
    cleanup: vi.fn(),
  };
  const doc = { numPages, getPage: vi.fn(async () => page) };
  const destroy = vi.fn(async () => {});
  const getDocument = vi.fn(() => ({
    promise: fail ? Promise.reject(fail) : Promise.resolve(doc),
    destroy,
    onProgress: undefined,
  }));
  const pdfjs = { getDocument } as unknown as PdfjsLib;
  return { pdfjs, getDocument, destroy, render };
}

function namedError(name: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(name), { name }, extra);
}

const pageInput = () => screen.getByRole("textbox", { name: /^Page/ });

let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;
const realFetch = globalThis.fetch;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  // Node cannot read a browser's object URLs; serve the test's as a PDF header.
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    String(input).startsWith("blob:")
      ? Promise.resolve(new Response("%PDF-"))
      : realFetch(input, init),
  );
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
  vi.unstubAllGlobals();
  vi.mocked(loadPdfjs).mockReset();
});

describe("PdfViewer", () => {
  it("renders every page of the document to a canvas", async () => {
    const fake = fakePdfjs({ numPages: 3 });
    vi.mocked(loadPdfjs).mockResolvedValue(fake.pdfjs);

    const { container } = render(<PdfViewer src={BLOB_URL} filename="lease.pdf" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading lease.pdf");
    expect(await screen.findByRole("img", { name: "Page 3 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "lease.pdf" })).toBeInTheDocument();
    expect(pageInput()).toHaveValue("1");
    expect(screen.getByText("/ 3")).toBeInTheDocument();
    await waitFor(() => expect(container.querySelectorAll("canvas")).toHaveLength(3));
    expect(fake.render).toHaveBeenCalledWith(
      expect.objectContaining({ canvas: expect.any(HTMLCanvasElement) }),
    );
  });

  it("streams an http(s) URL and reads other URLs as bytes", async () => {
    const fake = fakePdfjs();
    vi.mocked(loadPdfjs).mockResolvedValue(fake.pdfjs);

    const remote = render(<PdfViewer src="https://files.example/brief.pdf" />);
    await screen.findByRole("img", { name: "Page 1 of 3" });
    expect(fake.getDocument).toHaveBeenLastCalledWith({ url: "https://files.example/brief.pdf" });
    remote.unmount();

    render(<PdfViewer src="data:application/pdf;base64,JVBERi0=" />);
    await screen.findByRole("img", { name: "Page 1 of 3" });
    const [params] = fake.getDocument.mock.lastCall as unknown as [{ data: Uint8Array }];
    expect(new TextDecoder().decode(params.data)).toBe("%PDF-");
  });

  it("moves between pages with the buttons and the page field", async () => {
    vi.mocked(loadPdfjs).mockResolvedValue(fakePdfjs({ numPages: 3 }).pdfjs);
    render(<PdfViewer src={BLOB_URL} filename="lease.pdf" />);
    await screen.findByRole("img", { name: "Page 3 of 3" });

    const previous = screen.getByRole("button", { name: "Previous page" });
    const next = screen.getByRole("button", { name: "Next page" });
    expect(previous).toBeDisabled();

    fireEvent.click(next);
    expect(pageInput()).toHaveValue("2");
    expect(previous).toBeEnabled();

    fireEvent.change(pageInput(), { target: { value: "9" } });
    fireEvent.keyDown(pageInput(), { key: "Enter" });
    expect(pageInput()).toHaveValue("3");
    expect(next).toBeDisabled();

    fireEvent.change(pageInput(), { target: { value: "1x" } });
    expect(pageInput()).toHaveValue("1");
    fireEvent.keyDown(pageInput(), { key: "Escape" });
    expect(pageInput()).toHaveValue("3");
  });

  it("zooms in steps and returns to fit-to-width", async () => {
    vi.mocked(loadPdfjs).mockResolvedValue(fakePdfjs({ numPages: 1 }).pdfjs);
    render(<PdfViewer src={BLOB_URL} filename="lease.pdf" />);
    const page = await screen.findByRole("img", { name: "Page 1 of 1" });

    // jsdom lays nothing out, so the fitted width falls back to 100%.
    const fit = screen.getByRole("button", { name: "100%, fit to width" });
    expect(fit).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    const zoomed = screen.getByRole("button", { name: "125%, fit to width" });
    expect(zoomed).toHaveAttribute("aria-pressed", "false");
    await waitFor(() =>
      expect(page.style.width).toBe(`${Math.round(LETTER.width * CSS_PER_POINT * 1.25)}px`),
    );

    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByRole("button", { name: "75%, fit to width" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "75%, fit to width" }));
    expect(screen.getByRole("button", { name: "100%, fit to width" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("fits the first page to the width of the pane", async () => {
    const width = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(600);
    try {
      vi.mocked(loadPdfjs).mockResolvedValue(fakePdfjs({ numPages: 1 }).pdfjs);
      render(<PdfViewer src={BLOB_URL} />);
      const page = await screen.findByRole("img", { name: "Page 1 of 1" });
      // 600px less the column's 12px padding on each side.
      await waitFor(() => expect(page.style.width).toBe("576px"));
      const percent = Math.round((576 / (LETTER.width * CSS_PER_POINT)) * 100);
      expect(screen.getByRole("button", { name: `${percent}%, fit to width` })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    } finally {
      width.mockRestore();
    }
  });

  it("offers Download in the toolbar only when the host handles it", async () => {
    vi.mocked(loadPdfjs).mockResolvedValue(fakePdfjs().pdfjs);
    const onDownload = vi.fn();
    const { rerender } = render(<PdfViewer src={BLOB_URL} filename="lease.pdf" />);
    await screen.findByRole("img", { name: "Page 1 of 3" });
    expect(screen.queryByRole("button", { name: "Download lease.pdf" })).toBeNull();

    rerender(<PdfViewer src={BLOB_URL} filename="lease.pdf" onDownload={onDownload} />);
    fireEvent.click(screen.getByRole("button", { name: "Download lease.pdf" }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("says so and falls back to the browser's viewer when pdfjs-dist is missing", async () => {
    vi.mocked(loadPdfjs).mockRejectedValue(new MissingPdfjsError());
    const onDownload = vi.fn();
    const { container } = render(
      <PdfViewer src={BLOB_URL} filename="lease.pdf" size={2048} onDownload={onDownload} />,
    );

    expect(
      await screen.findByText(/does not include the page viewer/),
    ).toBeInTheDocument();
    const object = container.querySelector("object");
    expect(object).toHaveAttribute("data", BLOB_URL);
    expect(object).toHaveAttribute("type", "application/pdf");
    expect(screen.getByText("This browser does not show PDFs inline.")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    // A missing package will not appear on a retry.
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("falling back"),
      expect.any(MissingPdfjsError),
    );
  });

  it.each([
    ["PasswordException", {}, /password-protected/, false],
    ["InvalidPDFException", {}, /could not be read as a PDF/, false],
    ["ResponseException", { status: 404 }, /could not be downloaded \(HTTP 404\)/, true],
    ["UnknownErrorException", {}, /could not open this PDF/, true],
  ])("explains a %s and offers a retry only when one can help", async (name, extra, notice, retry) => {
    vi.mocked(loadPdfjs).mockResolvedValue(fakePdfjs({ fail: namedError(name, extra) }).pdfjs);
    render(<PdfViewer src={BLOB_URL} />);
    expect(await screen.findByText(notice)).toBeInTheDocument();
    expect(Boolean(screen.queryByRole("button", { name: "Try again" }))).toBe(retry);
  });

  it("loads the document again on Try again", async () => {
    const failing = fakePdfjs({ fail: namedError("UnknownErrorException") });
    const working = fakePdfjs({ numPages: 2 });
    vi.mocked(loadPdfjs)
      .mockResolvedValueOnce(failing.pdfjs)
      .mockResolvedValueOnce(working.pdfjs);
    render(<PdfViewer src={BLOB_URL} />);

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("img", { name: "Page 2 of 2" })).toBeInTheDocument();
  });

  it("destroys the loading task when it unmounts or the source changes", async () => {
    const fake = fakePdfjs();
    vi.mocked(loadPdfjs).mockResolvedValue(fake.pdfjs);
    const { rerender, unmount } = render(<PdfViewer src={BLOB_URL} />);
    await screen.findByRole("img", { name: "Page 1 of 3" });

    rerender(<PdfViewer src="blob:https://app.tangle.tools/other" />);
    expect(fake.destroy).toHaveBeenCalledTimes(1);
    await screen.findByRole("img", { name: "Page 1 of 3" });

    unmount();
    await act(async () => {});
    expect(fake.destroy).toHaveBeenCalledTimes(2);
  });
});
