import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileCard } from "./file-card";

const UPLOADED = new Date("2026-10-06T15:30:00Z");

describe("FileCard", () => {
  it("names the file with its size, date and uploader", () => {
    const { container } = render(
      <FileCard
        filename="Engagement letter.pdf"
        size={2_516_582}
        date={UPLOADED}
        uploader={{ name: "Dana Ruiz", role: "Client" }}
      />,
    );

    expect(screen.getByText("Engagement letter.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.4 MB")).toBeInTheDocument();
    expect(container.querySelector("time")).toHaveAttribute("datetime", UPLOADED.toISOString());
    expect(screen.getByText("Uploaded by Dana Ruiz (Client)")).toBeInTheDocument();
  });

  it("leaves out what it does not know", () => {
    const { container } = render(<FileCard filename="notes.txt" date="not a date" />);
    expect(container.querySelector("time")).toBeNull();
    expect(screen.queryByText(/Uploaded by/)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("takes its icon tone from the file kind, with the MIME type outranking the name", () => {
    const pdf = render(<FileCard filename="brief.pdf" />);
    expect(pdf.container.querySelector("[aria-hidden='true']")?.className).toContain(
      "--tone-orange-bg",
    );
    pdf.unmount();

    const sheet = render(<FileCard filename="export" mimeType="text/csv" />);
    expect(sheet.container.querySelector("[aria-hidden='true']")?.className).toContain(
      "--tone-lime-bg",
    );
  });

  it("offers Download and the host's own actions", () => {
    const onDownload = vi.fn();
    render(
      <FileCard
        filename="book.xlsx"
        description="Download to open this workbook in a spreadsheet app."
        onDownload={onDownload}
        actions={<button type="button">Open</button>}
      />,
    );

    expect(
      screen.getByText("Download to open this workbook in a spreadsheet app."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });
});
