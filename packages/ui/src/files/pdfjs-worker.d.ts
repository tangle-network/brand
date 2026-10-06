// pdfjs-dist ships no declarations for its worker module. pdf-loader.ts
// imports it only for its side effect of defining `globalThis.pdfjsWorker`.
declare module "pdfjs-dist/legacy/build/pdf.worker.min.mjs" {}
