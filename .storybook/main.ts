import type { StorybookConfig } from "@storybook/react-vite";

// PdfViewer stories read real PDFs from ./fixtures and the pdf.js worker and
// decoder assets from the installed pdfjs-dist, served the way an app would.
const pdfjs = "../packages/ui/node_modules/pdfjs-dist";

const config: StorybookConfig = {
  stories: ["../packages/*/src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  staticDirs: [
    { from: "./fixtures", to: "/fixtures" },
    { from: `${pdfjs}/legacy/build`, to: "/pdfjs/legacy/build" },
    ...["wasm", "cmaps", "standard_fonts", "iccs"].map((directory) => ({
      from: `${pdfjs}/${directory}`,
      to: `/pdfjs/${directory}`,
    })),
  ],
};

export default config;
