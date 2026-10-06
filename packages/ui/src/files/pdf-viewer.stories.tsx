import type { Meta, StoryObj } from "@storybook/react";
import { configurePdfViewer, type PdfViewerConfig } from "./pdf-loader";
import { PdfViewer } from "./pdf-viewer";

// Served by .storybook/main.ts from .storybook/fixtures.
// US Courts form AO 440, Summons in a Civil Action: two pages, a work of the
// United States government (https://www.uscourts.gov/sites/default/files/ao440.pdf).
const SUMMONS = "/fixtures/summons-ao440.pdf";
// A fictional three-page letter stored as CCITT Group 4 images at 200 dpi, the
// way an office scanner writes black-and-white pages.
const SCANNED_LETTER = "/fixtures/scanned-letter.pdf";

/** The worker and decoder assets, served the way an app serves them. */
const SERVED_ASSETS: PdfViewerConfig = {
  workerSrc: "/pdfjs/legacy/build/pdf.worker.min.mjs",
  assetsUrl: "/pdfjs/",
};

// Storybook deep-merges parameters, so an empty story-level object would keep
// the served assets; a named mode cannot be merged into.
type PdfAssets = "served" | "none";

const meta: Meta<typeof PdfViewer> = {
  title: "Files/PdfViewer",
  component: PdfViewer,
  parameters: { layout: "fullscreen", pdfAssets: "served" satisfies PdfAssets },
  decorators: [
    (Story, context) => {
      // pdf.js fixes its worker with the first document on the page, so a
      // story's configuration holds when the story is opened on its own.
      configurePdfViewer(context.parameters.pdfAssets === "none" ? {} : SERVED_ASSETS);
      return (
        <div className="h-[100dvh] w-full bg-background p-3 text-foreground sm:h-[680px] sm:max-w-[820px]">
          <Story />
        </div>
      );
    },
  ],
  args: {
    src: SUMMONS,
    filename: "Summons in a Civil Action.pdf",
    size: 25_380,
    onDownload: () => {},
    className: "h-full",
  },
};

export default meta;
type Story = StoryObj<typeof PdfViewer>;

export const CourtForm: Story = {
  name: "Court form",
};

export const CourtFormLight: Story = {
  name: "Court form (light)",
  globals: { theme: "light" },
};

export const ScannedLetter: Story = {
  name: "Scanned letter (CCITT pages)",
  args: {
    src: SCANNED_LETTER,
    filename: "Notice of lease termination.pdf",
    size: 75_955,
  },
};

export const ZeroConfiguration: Story = {
  name: "Zero configuration (main-thread worker)",
  parameters: { pdfAssets: "none" satisfies PdfAssets },
};

export const NotAPdf: Story = {
  name: "Not a PDF (falls back)",
  args: {
    src: "data:application/pdf;base64,VGhpcyBpcyBub3QgYSBQREYu",
    filename: "Exhibit C.pdf",
    size: 15,
  },
};
