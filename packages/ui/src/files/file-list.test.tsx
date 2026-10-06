import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileList, type FileListItem } from "./file-list";

interface CaseDocument extends FileListItem {
  matterId: string;
}

const FILES: CaseDocument[] = [
  {
    id: "lease",
    matterId: "m-1",
    filename: "Commercial lease.pdf",
    size: 482_000,
    date: "2026-10-01T12:00:00Z",
    uploader: { name: "Dana Ruiz", role: "Client" },
  },
  {
    id: "photos",
    matterId: "m-1",
    filename: "Water damage.jpg",
    mimeType: "image/jpeg",
    size: 3_100_000,
  },
];

describe("FileList", () => {
  it("shows each file's kind, size and uploader", () => {
    render(<FileList files={FILES} aria-label="Case documents" />);
    const rows = within(screen.getByRole("list", { name: "Case documents" })).getAllByRole(
      "listitem",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Commercial lease.pdf");
    // A dot between facts on screen, a comma for a screen reader.
    expect(rows[0]).toHaveTextContent(/PDF · , 471 KB · , .+ · , Dana Ruiz \(Client\)/);
    expect(rows[1]).toHaveTextContent("Image · , 3.0 MB");
  });

  it("opens a file from its row and hands back the host's own record", () => {
    const onOpen = vi.fn();
    render(<FileList files={FILES} onOpen={onOpen} activeId="photos" />);

    fireEvent.click(screen.getByRole("button", { name: /Commercial lease\.pdf/ }));
    expect(onOpen).toHaveBeenCalledWith(FILES[0]);
    expect(onOpen.mock.calls[0][0].matterId).toBe("m-1");

    expect(screen.getByRole("button", { name: /Water damage\.jpg/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: /Commercial lease\.pdf/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("downloads and deletes through per-file buttons", () => {
    const onDownload = vi.fn();
    const onDelete = vi.fn();
    render(<FileList files={FILES} onDownload={onDownload} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Download Water damage.jpg" }));
    expect(onDownload).toHaveBeenCalledWith(FILES[1]);
    fireEvent.click(screen.getByRole("button", { name: "Delete Commercial lease.pdf" }));
    expect(onDelete).toHaveBeenCalledWith(FILES[0]);
  });

  it("renders no controls the host did not ask for", () => {
    render(<FileList files={FILES} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the empty message in place of the list", () => {
    const { rerender } = render(<FileList files={[]} />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText("No files yet.")).toBeInTheDocument();

    rerender(<FileList files={[]} empty="Upload the lease to start." />);
    expect(screen.getByText("Upload the lease to start.")).toBeInTheDocument();
  });
});
