import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileArtifactPane } from "./file-artifact-pane";
import { CSV_PREVIEW_ROW_LIMIT, parseCsv } from "./file-preview";
import { MissingPdfjsError, loadPdfjs } from "./pdf-loader";

vi.mock("./pdf-loader", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./pdf-loader")>()),
  loadPdfjs: vi.fn(),
}));

const BLOB_URL = "blob:https://app.tangle.tools/1f2e3d4c";

function csvWithRows(rowCount: number): string {
  const rows = Array.from({ length: rowCount }, (_, i) => `"Ada, Countess ${i}",x,${i}`);
  return ["name,note,n", ...rows].join("\n");
}

describe("FileArtifactPane previews", () => {
  it("renders an image from blobUrl and toggles natural size on click", () => {
    const { container } = render(
      <FileArtifactPane filename="chart.png" blobUrl={BLOB_URL} mimeType="image/png" />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", BLOB_URL);
    expect(img).toHaveAttribute("alt", "chart.png");
    expect(img).toHaveClass("object-contain");

    const toggle = screen.getByRole("button", { name: "Show image at natural size" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Fit image to pane" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(container.querySelector("img")).toHaveClass("max-w-none");
  });

  it("renders a PDF in PdfViewer, and in an <object> of the blobUrl without pdfjs-dist", async () => {
    vi.mocked(loadPdfjs).mockRejectedValue(new MissingPdfjsError());
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <FileArtifactPane filename="report.pdf" blobUrl={BLOB_URL} mimeType="application/pdf" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading report.pdf");
    expect(await screen.findByText(/does not include the page viewer/)).toBeInTheDocument();
    const viewer = container.querySelector("object");
    expect(viewer).toHaveAttribute("data", BLOB_URL);
    expect(viewer).toHaveAttribute("type", "application/pdf");
    expect(viewer).toHaveAttribute("title", "report.pdf");
    consoleError.mockRestore();
  });

  it("renders video and audio with native controls", () => {
    const video = render(<FileArtifactPane filename="demo.mp4" blobUrl={BLOB_URL} />);
    const videoElement = video.container.querySelector("video");
    expect(videoElement).not.toBeNull();
    expect(videoElement).toHaveAttribute("src", BLOB_URL);
    expect(videoElement).toHaveAttribute("controls");
    video.unmount();

    const audio = render(<FileArtifactPane filename="voice.m4a" blobUrl={BLOB_URL} />);
    const audioElement = audio.container.querySelector("audio");
    expect(audioElement).not.toBeNull();
    expect(audioElement).toHaveAttribute("src", BLOB_URL);
    expect(audioElement).toHaveAttribute("controls");
    expect(audio.getAllByText("voice.m4a").length).toBeGreaterThan(1); // header + player label
  });

  it("parses quoted commas in CSV and caps the table at the row limit", () => {
    const total = CSV_PREVIEW_ROW_LIMIT + 1;
    const { container } = render(
      <FileArtifactPane filename="people.csv" content={csvWithRows(total)} />,
    );

    const headers = Array.from(container.querySelectorAll("thead th")).map((th) => th.textContent);
    expect(headers).toEqual(["name", "note", "n"]);
    expect(container.querySelectorAll("thead th")[0]).toHaveClass("sticky");

    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows).toHaveLength(CSV_PREVIEW_ROW_LIMIT);
    expect(bodyRows[0].querySelectorAll("td")[0]).toHaveTextContent("Ada, Countess 0");
    expect(bodyRows[0].querySelectorAll("td")).toHaveLength(3);

    expect(
      screen.getByText(`Showing ${CSV_PREVIEW_ROW_LIMIT} of ${total} rows · 3 columns`),
    ).toBeInTheDocument();
  });

  it("reports the row count when the CSV is under the cap", () => {
    render(<FileArtifactPane filename="people.csv" content={csvWithRows(3)} />);
    expect(screen.getByText("3 rows · 3 columns")).toBeInTheDocument();
  });

  it("renders a spreadsheet as a download card and calls onDownload", () => {
    const onDownload = vi.fn();
    render(
      <FileArtifactPane filename="book.xlsx" size={1536} onDownload={onDownload} />,
    );

    expect(screen.getByText("1.5 KB")).toBeInTheDocument();
    expect(
      screen.getByText("Download to open this workbook in a spreadsheet app."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledTimes(1);

    // The header keeps its own download control.
    fireEvent.click(screen.getByRole("button", { name: "Download book.xlsx" }));
    expect(onDownload).toHaveBeenCalledTimes(2);
  });

  it("renders markdown through the package Markdown renderer", () => {
    const { container } = render(
      <FileArtifactPane filename="README.md" content={"# Title\n\nBody with **bold**."} />,
    );
    expect(container.querySelector(".tangle-prose")).not.toBeNull();
    expect(container.querySelector("h1")).toHaveTextContent("Title");
    expect(container.querySelector("strong")).toHaveTextContent("bold");
  });

  it("forwards Markdown URL transforms to file and rich editor previews", async () => {
    const urlTransform = vi.fn((url: string, key: string) => (
      key === "href" && url === "sibling.md"
        ? "/app/ws-1/vault?file=docs%2Fsibling.md"
        : url
    ));
    const readOnly = render(
      <FileArtifactPane
        filename="README.md"
        content={"[Sibling](sibling.md)"}
        urlTransform={urlTransform}
      />,
    );

    expect(screen.getByRole("link", { name: "Sibling" })).toHaveAttribute(
      "href",
      "/app/ws-1/vault?file=docs%2Fsibling.md",
    );
    readOnly.unmount();

    render(
      <FileArtifactPane
        path="docs/README.md"
        filename="README.md"
        content={"[Sibling](sibling.md)"}
        urlTransform={urlTransform}
        editor={{ enabled: true, defaultMode: "preview" }}
      />,
    );

    expect(await screen.findByRole("link", { name: "Sibling" })).toHaveAttribute(
      "href",
      "/app/ws-1/vault?file=docs%2Fsibling.md",
    );
    expect(urlTransform).toHaveBeenCalledWith(
      "sibling.md",
      "href",
      expect.objectContaining({ tagName: "a" }),
    );
  });

  it("renders a binary file with no download link as one muted sentence", () => {
    const onDownload = vi.fn();
    const withDownload = render(
      <FileArtifactPane filename="weights.bin" onDownload={onDownload} />,
    );
    expect(
      withDownload.getByText("This file needs a download link to preview."),
    ).toBeInTheDocument();
    fireEvent.click(withDownload.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    withDownload.unmount();

    render(<FileArtifactPane filename="weights.bin" />);
    expect(screen.getByText("This file needs a download link to preview.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download" })).toBeNull();
  });

  it("renders the same sentence for an image, PDF, or video without a blobUrl", () => {
    for (const filename of ["chart.png", "report.pdf", "demo.mp4"]) {
      const { getByText, unmount } = render(<FileArtifactPane filename={filename} />);
      expect(getByText("This file needs a download link to preview.")).toBeInTheDocument();
      unmount();
    }
  });

  it("renders an unknown file's text content as text", () => {
    const { container } = render(
      <FileArtifactPane filename="Makefile.custom" content={"build:\n\tgo build"} />,
    );
    expect(container.querySelector("pre")).toHaveTextContent("go build");
    expect(container.querySelector("code")).toBeNull();
  });

  it("keeps code on the syntax highlighter and text on a plain pre", () => {
    const code = render(
      <FileArtifactPane filename="server.ts" content={"const x = 1;\nexport { x };"} />,
    );
    expect(code.container.querySelector("code")).not.toBeNull();
    expect(code.container.querySelector("table")).toBeNull();
    expect(code.getByText(/ts · 2 lines/)).toBeInTheDocument();
    code.unmount();

    const text = render(<FileArtifactPane filename="notes.txt" content="just words" />);
    expect(text.container.querySelector("pre")).toHaveTextContent("just words");
    expect(text.container.querySelector("code")).toBeNull();
  });

  it("renders SVG source as code when the host read it as text", () => {
    const { container } = render(
      <FileArtifactPane filename="icon.svg" content={'<svg xmlns="http://www.w3.org/2000/svg"/>'} />,
    );
    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("parseCsv", () => {
  it("keeps commas, line breaks, and doubled quotes inside quoted cells", () => {
    expect(parseCsv('a,b\n"x, y","line 1\nline 2"\n"say ""hi""",z')).toEqual([
      ["a", "b"],
      ["x, y", "line 1\nline 2"],
      ['say "hi"', "z"],
    ]);
  });

  it("trims unquoted cells and accepts CRLF, blank lines, and a trailing line break", () => {
    expect(parseCsv("a, b\r\n\r\n1 ,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns no rows for empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\n\n")).toEqual([]);
  });
});

describe("FileArtifactPane controlled drafts", () => {
  it("retains a host draft and saves it against the persisted baseline", async () => {
    const onSave = vi.fn();
    const draft = "# Unsaved source draft";
    const props = {
      filename: "notes.md",
      content: draft,
      editor: { enabled: true, savedContent: "# Saved notes", onSave },
    };
    const view = render(<FileArtifactPane {...props} />);
    const save = await screen.findByRole("button", { name: "Save changes" });
    expect(screen.getByRole("heading", { name: "Unsaved source draft" })).toBeVisible();
    expect(screen.getByText("Unsaved changes")).toBeVisible();
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith(draft);

    view.rerender(<FileArtifactPane {...props} editor={{ ...props.editor, savedContent: draft }} />);
    expect(screen.getByText("Saved")).toBeVisible();
    expect(save).toBeDisabled();
  });
});
