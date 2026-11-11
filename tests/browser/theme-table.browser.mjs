/** Real browser consumers of configurable theme persistence and sortable headers. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

const out = process.env.UI_THEME_EVIDENCE;
if (out) await mkdir(out, { recursive: true });
const server = await createServer({ configFile: false, optimizeDeps: { entries: ["tests/browser/theme-table.fixture.tsx"], include: ["react", "react-dom/client", "react/jsx-runtime"] }, server: { host: "127.0.0.1", port: 0 }, plugins: [{ name: "theme-table-contract", configureServer(vite) {
  vite.middlewares.use("/theme-table", (_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root"></div><script type="module" src="/tests/browser/theme-table.fixture.tsx"></script></body></html>');
  });
} }] });
await server.listen();
const url = server.resolvedUrls.local[0] + "theme-table", browser = await chromium.launch({ headless: true }), cases = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: "dark", ...(out ? { recordVideo: { dir: out } } : {}) });
    try {
      const page = await context.newPage(), errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(url);
      const primary = page.locator('section[aria-label="Appearance"] output'), secondary = page.locator('section[aria-label="Terminal"] output');
      await primary.getByText("light:light", { exact: true }).waitFor();
      assert.equal(await page.locator("html").getAttribute("data-sandbox-theme"), "vault");
      await page.getByRole("button", { name: "dark", exact: true }).click();
      await secondary.getByText("dark:dark", { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem("sandbox-theme")), "midnight");
      assert.equal(await page.locator("html").getAttribute("data-sandbox-theme"), null);
      await page.reload();
      await primary.getByText("dark:dark", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Public page", exact: true }).click();
      assert.equal(await page.locator("html").getAttribute("data-sandbox-theme"), "vault");
      assert.equal(await page.evaluate(() => localStorage.getItem("sandbox-theme")), "midnight");
      await page.getByRole("button", { name: "Dashboard", exact: true }).click();
      await primary.getByText("dark:dark", { exact: true }).waitFor();
      await page.getByRole("button", { name: "system", exact: true }).click();
      await page.emulateMedia({ colorScheme: "light" });
      await secondary.getByText("system:light", { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem("sandbox-theme")), "system");
      const other = await context.newPage();
      await other.goto(url);
      await other.getByRole("button", { name: "dark", exact: true }).click();
      await primary.getByText("dark:dark", { exact: true }).waitFor();
      await other.close();
      const header = page.getByRole("columnheader"), button = page.getByRole("button", { name: "Sort by Requests" });
      for (const [key, expected, first] of [["Enter", "descending", "9"], ["Space", "ascending", "2"], ["Enter", "none", "9"]]) {
        await button.focus(); await button.press(key);
        assert.equal(await header.getAttribute("aria-sort"), expected);
        assert.equal(await page.getByRole("cell").first().innerText(), first);
      }
      assert.equal(await page.locator("html").evaluate(el => el.scrollWidth <= innerWidth), true);
      assert.deepEqual(errors, []);
      if (out) await page.screenshot({ path: resolve(out, `theme-table-${width}.png`) });
      cases.push({ width, status: "PASS", assertions: "default, persistence, public-page restoration, OS updates, cross-tab/component synchronization, keyboard three-state sorting, reflow" });
    } finally { await context.close(); }
  }
  for (const storageDenied of [false, true]) {
    const context = await browser.newContext({ colorScheme: "dark" });
    try {
      if (storageDenied) await context.addInitScript(() => { Object.defineProperty(Storage.prototype, "getItem", { value: () => { throw Error("storage unavailable"); } }); Object.defineProperty(Storage.prototype, "setItem", { value: () => { throw Error("storage unavailable"); } }); });
      const page = await context.newPage(); await page.goto(url + "?default");
      await page.getByText("system:dark", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Default light" }).click();
      await page.getByText("light:light", { exact: true }).waitFor();
      cases.push({ storageDenied, status: "PASS", assertions: "parameterless hook compatibility and storage-independent preference" });
    } finally { await context.close(); }
  }
  console.log(JSON.stringify({ cases }));
  if (out) await writeFile(resolve(out, "receipt.json"), JSON.stringify({ cases }, null, 2));
} finally { await browser.close(); await server.close(); }
