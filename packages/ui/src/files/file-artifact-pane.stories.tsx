import type { Meta, StoryObj } from "@storybook/react";
import { FileArtifactPane } from "./file-artifact-pane";

const TS_SOURCE = `interface SandboxConfig {
  model: string
  timeout: number
  env: Record<string, string>
}

// Create a new sandbox and stream its output.
export async function run(config: SandboxConfig) {
  const sandbox = await Sandbox.create(config)
  for await (const chunk of sandbox.stream()) {
    process.stdout.write(chunk)
  }
}`;

const MARKDOWN_SOURCE = `# Run report

The agent finished **3 of 3** tasks.

| Task | Result |
| --- | --- |
| Build | pass |
| Test | 315 / 315 |
| Deploy | staging |

\`\`\`ts
export const ready = true
\`\`\`
`;

// A transparent SVG, larger than the pane, so the checker ground shows through
// and the fit-to-pane / natural-size toggle has a visible effect.
const IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8263FF"/>
      <stop offset="1" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <circle cx="220" cy="180" r="120" fill="url(#g)"/>
  <rect x="360" y="80" width="200" height="200" rx="28" fill="#FFB347" opacity="0.9"/>
  <text x="320" y="330" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#E8E6F6">chart.svg · 1600 × 900</text>
</svg>`;
const IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(IMAGE_SVG)}`;

// One-page PDF (Helvetica text and a rule) so the viewer has real content.
const PDF_URL =
  "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAyODkgPj4Kc3RyZWFtCkJUIC9GMSAyMiBUZiA1NiA3MDAgVGQgKEZpbGVBcnRpZmFjdFBhbmUpIFRqIEVUCkJUIC9GMSAxMiBUZiA1NiA2NzIgVGQgKFBERiBwcmV2aWV3IHJlbmRlcnMgdGhlIGJsb2JVcmwgYXQgZnVsbCBwYW5lIGhlaWdodC4pIFRqIEVUCkJUIC9GMSAxMiBUZiA1NiA2NTIgVGQgKEV2ZXJ5IGNvbnN1bWVyIG9mIEB0YW5nbGUtbmV0d29yay91aS9maWxlcyBnZXRzIHRoaXMgZm9yIGZyZWUuKSBUaiBFVAo1NiA2MjAgbSA1NTYgNjIwIGwgUwpCVCAvRjEgMTAgVGYgNTYgNTk2IFRkIChQYWdlIDEgb2YgMSkgVGogRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDA1ODEgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo2NTEKJSVFT0YK";

const CSV_SOURCE = [
  "id,name,role,note,active",
  ...Array.from({ length: 520 }, (_, i) =>
    [
      i + 1,
      `"Lovelace, Ada ${i + 1}"`,
      ["engineer", "maintainer", "architect"][i % 3],
      `"Handles ""quoted"" values, and commas"`,
      i % 4 === 0 ? "false" : "true",
    ].join(","),
  ),
].join("\n");

// CC0 sample media hosted by MDN; the story only needs a playable src.
const VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const AUDIO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

const meta: Meta<typeof FileArtifactPane> = {
  title: "Files/FileArtifactPane",
  component: FileArtifactPane,
  parameters: { layout: "fullscreen" },
  argTypes: {
    onDownload: { action: "download" },
    onClose: { action: "close" },
  },
  decorators: [
    (Story) => (
      <div className="h-[560px] w-[760px] overflow-hidden rounded-xl border border-border bg-card text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileArtifactPane>;

export const Code: Story = {
  args: { filename: "run.ts", path: "src/run.ts", content: TS_SOURCE },
};

export const Image: Story = {
  args: {
    filename: "chart.svg",
    path: "out/chart.svg",
    blobUrl: IMAGE_URL,
    mimeType: "image/svg+xml",
    size: 1_204,
  },
};

export const Pdf: Story = {
  name: "PDF",
  args: {
    filename: "report.pdf",
    path: "out/report.pdf",
    blobUrl: PDF_URL,
    mimeType: "application/pdf",
    size: 834,
  },
};

export const Csv: Story = {
  name: "CSV (520 rows, capped at 500)",
  args: { filename: "people.csv", path: "data/people.csv", content: CSV_SOURCE },
};

export const Video: Story = {
  args: {
    filename: "flower.mp4",
    path: "media/flower.mp4",
    blobUrl: VIDEO_URL,
    mimeType: "video/mp4",
  },
};

export const Audio: Story = {
  args: {
    filename: "t-rex-roar.mp3",
    path: "media/t-rex-roar.mp3",
    blobUrl: AUDIO_URL,
    mimeType: "audio/mpeg",
  },
};

export const Spreadsheet: Story = {
  args: { filename: "ledger.xlsx", path: "finance/ledger.xlsx", size: 48_213 },
};

export const MarkdownProse: Story = {
  name: "Markdown",
  args: { filename: "REPORT.md", path: "out/REPORT.md", content: MARKDOWN_SOURCE },
};

export const BinaryWithoutLink: Story = {
  name: "Binary without a download link",
  args: { filename: "weights.bin", path: "model/weights.bin", size: 402_653_184 },
};
