import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FilePreview } from "./file-preview";

describe("FilePreview", () => {
  it("renders code through the syntax highlighter, not a plain table", () => {
    const { container, getByText } = render(
      <FilePreview filename="server.ts" content={'const x: number = 1;\nexport { x };'} />,
    );

    // react-syntax-highlighter emits a <code> element; the old plain viewer
    // used a <table>. Asserting both pins the artifact viewer to the shared,
    // theme-aware CodeBlock used by chat.
    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("table")).toBeNull();

    // Header label carries the extension + line count, and a copy button is wired.
    expect(getByText(/ts · 2 lines/i)).toBeInTheDocument();
    expect(container.querySelector('button[title="Copy to clipboard"]')).not.toBeNull();
  });

  it("renders JSON through the highlighter too", () => {
    const { container } = render(
      <FilePreview filename="config.json" content={'{\n  "a": 1\n}'} />,
    );
    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("table")).toBeNull();
  });

  it("routes MIME-detected json on an extensionless file to the code viewer", () => {
    const { container } = render(
      <FilePreview filename="config" mimeType="application/json" content={'{"a":1}'} />,
    );
    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("pre.bg-background")).toBeNull(); // not the plain TextPreview
  });

  it("renders csv as a table", () => {
    const { container } = render(
      <FilePreview filename="data.csv" content={"a,b\n1,2"} />,
    );
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("renders plain text in a pre, without the highlighter", () => {
    const { container } = render(
      <FilePreview filename="notes.txt" content={"just words"} />,
    );
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector("code")).toBeNull();
  });
});
