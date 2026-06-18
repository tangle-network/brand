import { describe, it, expect } from "vitest";
import {
  detectFileFormat,
  fileExtension,
  getFormatLabel,
  getSyntaxLanguage,
} from "./file-format";

describe("detectFileFormat", () => {
  it("detects by extension", () => {
    expect(detectFileFormat("report.pdf")).toBe("pdf");
    expect(detectFileFormat("photo.PNG")).toBe("image");
    expect(detectFileFormat("data.csv")).toBe("csv");
    expect(detectFileFormat("book.xlsx")).toBe("spreadsheet");
    expect(detectFileFormat("legacy.xls")).toBe("spreadsheet");
    expect(detectFileFormat("main.py")).toBe("code");
    expect(detectFileFormat("app.tsx")).toBe("code");
    expect(detectFileFormat("config.json")).toBe("json");
    expect(detectFileFormat("compose.yaml")).toBe("yaml");
    expect(detectFileFormat("compose.yml")).toBe("yaml");
    expect(detectFileFormat("README.md")).toBe("markdown");
    expect(detectFileFormat("notes.markdown")).toBe("markdown");
    expect(detectFileFormat("output.log")).toBe("text");
  });

  it("treats shell dotfiles as code", () => {
    expect(detectFileFormat(".bashrc")).toBe("code");
    expect(detectFileFormat(".profile")).toBe("code");
    expect(detectFileFormat(".gitignore")).toBe("code");
  });

  it("prefers MIME type when it is more specific", () => {
    expect(detectFileFormat("file", "application/pdf")).toBe("pdf");
    expect(detectFileFormat("blob", "image/png")).toBe("image");
    expect(detectFileFormat("CHANGELOG", "text/markdown")).toBe("markdown");
    expect(detectFileFormat("noext", "text/plain")).toBe("text");
  });

  it("falls back to unknown when nothing matches", () => {
    expect(detectFileFormat("mystery.bin")).toBe("unknown");
    expect(detectFileFormat("noextension")).toBe("unknown");
  });

  it("lets a concrete extension win over a generic text/plain MIME", () => {
    expect(detectFileFormat("config.json", "text/plain")).toBe("json");
    expect(detectFileFormat("main.py", "text/plain")).toBe("code");
  });

  it("detects structured-data MIME types on generically-named files", () => {
    expect(detectFileFormat("data", "application/json")).toBe("json");
    expect(detectFileFormat("records", "text/csv")).toBe("csv");
    expect(detectFileFormat("export", "application/csv")).toBe("csv");
    expect(detectFileFormat("config", "application/yaml")).toBe("yaml");
    expect(detectFileFormat("feed", "application/x-yaml")).toBe("yaml");
    expect(detectFileFormat("feed", "text/yaml")).toBe("yaml");
  });

  it("ignores MIME charset parameters", () => {
    expect(detectFileFormat("data", "application/json; charset=utf-8")).toBe("json");
    expect(detectFileFormat("blob", "IMAGE/PNG")).toBe("image");
  });

  it("treats an authoritative MIME type as outranking a conflicting extension", () => {
    expect(detectFileFormat("notes.json", "text/markdown")).toBe("markdown");
    expect(detectFileFormat("page.txt", "application/json")).toBe("json");
  });
});

describe("getFormatLabel", () => {
  it("maps every format to a human label", () => {
    expect(getFormatLabel("pdf")).toBe("PDF");
    expect(getFormatLabel("json")).toBe("JSON");
    expect(getFormatLabel("yaml")).toBe("YAML");
    expect(getFormatLabel("markdown")).toBe("Markdown");
    expect(getFormatLabel("spreadsheet")).toBe("Spreadsheet");
    expect(getFormatLabel("unknown")).toBe("File");
  });
});

describe("getSyntaxLanguage", () => {
  it("maps known extensions to highlight.js language ids", () => {
    expect(getSyntaxLanguage("main.py")).toBe("python");
    expect(getSyntaxLanguage("server.ts")).toBe("typescript");
    expect(getSyntaxLanguage("index.mjs")).toBe("javascript");
    expect(getSyntaxLanguage("config.json")).toBe("json");
    expect(getSyntaxLanguage("compose.yml")).toBe("yaml");
    expect(getSyntaxLanguage(".bashrc")).toBe("bash");
    expect(getSyntaxLanguage("lib.rs")).toBe("rust");
  });

  it("resolves from a full path, not just a basename", () => {
    expect(getSyntaxLanguage("src/server/index.ts")).toBe("typescript");
  });

  it("returns undefined for unmapped extensions", () => {
    expect(getSyntaxLanguage("mystery.bin")).toBeUndefined();
    expect(getSyntaxLanguage("noextension")).toBeUndefined();
  });
});

describe("fileExtension", () => {
  it("lowercases the trailing extension", () => {
    expect(fileExtension("Photo.JPEG")).toBe("jpeg");
  });

  it("returns the dotfile name for files that are all extension", () => {
    expect(fileExtension(".gitignore")).toBe("gitignore");
  });

  it("ignores dots in directory components", () => {
    expect(fileExtension("my.config.dir/file")).toBe("file");
    expect(fileExtension("v1.2.0/Makefile")).toBe("makefile");
    expect(fileExtension("a.b.c/server.ts")).toBe("ts");
  });
});
