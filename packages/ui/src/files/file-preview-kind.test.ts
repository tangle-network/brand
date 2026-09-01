import { describe, expect, it } from "vitest";
import {
  detectFileFormat,
  getFormatLabel,
  resolveFilePreviewKind,
  type FilePreviewKind,
} from "./file-format";

describe("resolveFilePreviewKind", () => {
  it.each<[string, string | undefined, FilePreviewKind]>([
    // Images
    ["photo.png", undefined, "image"],
    ["photo.jpg", undefined, "image"],
    ["photo.jpeg", undefined, "image"],
    ["anim.gif", undefined, "image"],
    ["photo.webp", undefined, "image"],
    ["icon.svg", undefined, "image"],
    ["photo.avif", undefined, "image"],
    // Documents
    ["report.pdf", undefined, "pdf"],
    // Video
    ["clip.mp4", undefined, "video"],
    ["clip.webm", undefined, "video"],
    ["clip.mov", undefined, "video"],
    // Audio
    ["track.mp3", undefined, "audio"],
    ["track.wav", undefined, "audio"],
    ["track.ogg", undefined, "audio"],
    ["track.m4a", undefined, "audio"],
    // Tabular
    ["data.csv", undefined, "csv"],
    ["book.xlsx", undefined, "spreadsheet"],
    ["legacy.xls", undefined, "spreadsheet"],
    // Prose and structured text
    ["README.md", undefined, "markdown"],
    ["notes.markdown", undefined, "markdown"],
    ["config.json", undefined, "json"],
    ["compose.yaml", undefined, "yaml"],
    ["compose.yml", undefined, "yaml"],
    ["server.ts", undefined, "code"],
    ["main.py", undefined, "code"],
    ["output.log", undefined, "text"],
    ["notes.txt", undefined, "text"],
  ])("%s (%s) → %s", (filename, mimeType, kind) => {
    expect(resolveFilePreviewKind(filename, mimeType)).toBe(kind);
  });

  it("lets an authoritative MIME type outrank the extension", () => {
    expect(resolveFilePreviewKind("photo.txt", "image/png")).toBe("image");
    expect(resolveFilePreviewKind("scan.png", "application/pdf")).toBe("pdf");
    expect(resolveFilePreviewKind("clip.bin", "video/mp4")).toBe("video");
    expect(resolveFilePreviewKind("track.webm", "audio/webm")).toBe("audio");
    expect(
      resolveFilePreviewKind(
        "export.csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("spreadsheet");
    expect(resolveFilePreviewKind("book.bin", "application/vnd.ms-excel")).toBe("spreadsheet");
    expect(resolveFilePreviewKind("notes.json", "text/markdown")).toBe("markdown");
  });

  it("resolves MIME-only files with no extension", () => {
    expect(resolveFilePreviewKind("blob", "image/webp")).toBe("image");
    expect(resolveFilePreviewKind("blob", "video/webm")).toBe("video");
    expect(resolveFilePreviewKind("blob", "audio/mpeg")).toBe("audio");
    expect(resolveFilePreviewKind("blob", "application/json; charset=utf-8")).toBe("json");
    expect(resolveFilePreviewKind("blob", "text/plain")).toBe("text");
  });

  it("ignores a generic MIME type and keeps the extension", () => {
    expect(resolveFilePreviewKind("photo.png", "application/octet-stream")).toBe("image");
    expect(resolveFilePreviewKind("main.py", "text/plain")).toBe("code");
  });

  it("resolves everything unmatched to binary", () => {
    expect(resolveFilePreviewKind("mystery.bin")).toBe("binary");
    expect(resolveFilePreviewKind("noextension")).toBe("binary");
    expect(resolveFilePreviewKind("weights", "application/octet-stream")).toBe("binary");
    expect(resolveFilePreviewKind("pdf")).toBe("binary");
  });

  it("agrees with detectFileFormat for every format that has a renderer", () => {
    for (const filename of [
      "photo.png",
      "report.pdf",
      "clip.mp4",
      "track.mp3",
      "data.csv",
      "book.xlsx",
      "README.md",
      "config.json",
      "compose.yml",
      "server.ts",
      "notes.txt",
    ]) {
      expect(resolveFilePreviewKind(filename)).toBe(detectFileFormat(filename));
    }
    expect(detectFileFormat("mystery.bin")).toBe("unknown");
    expect(resolveFilePreviewKind("mystery.bin")).toBe("binary");
  });

  it("labels every preview kind", () => {
    expect(getFormatLabel("video")).toBe("Video");
    expect(getFormatLabel("audio")).toBe("Audio");
    expect(getFormatLabel("image")).toBe("Image");
    expect(getFormatLabel("binary")).toBe("File");
  });
});
