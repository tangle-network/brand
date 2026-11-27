/** The data table in a real browser, on Brand's tokens and UI's presentation CSS with no Tailwind: its card, header,
 * rows, numbers, states, bars, money, empty row, hover and sort, in light and dark, at phone and desktop width. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

const out = process.env.UI_DATA_TABLE_EVIDENCE;
if (out) await mkdir(out, { recursive: true });
const fixture = "tests/browser/data-table.fixture.tsx";
const server = await createServer({
  configFile: false,
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: [fixture], include: ["react", "react-dom/client", "react/jsx-runtime"] },
  server: { host: "127.0.0.1", port: 0 },
  plugins: [{ name: "data-table-fixture", configureServer(vite) {
    vite.middlewares.use("/data-table", (_req, res) => {
      res.setHeader("content-type", "text/html");
      res.end(`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root"></div><script type="module" src="/${fixture}"></script></body></html>`);
    });
  } }],
});
await server.listen();
const url = server.resolvedUrls.local[0] + "data-table", browser = await chromium.launch({ headless: true }), cases = [];
const STATES = ["running", "done", "failed", "stopped", "waiting"];

try {
  for (const theme of ["light", "dark"]) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: "reduce", ...(out ? { recordVideo: { dir: resolve(out, "video"), size: { width, height: 900 } } } : {}) });
      try {
        const page = await context.newPage(), errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
        await page.goto(`${url}?theme=${theme}`);
        const runs = page.getByRole("region", { name: "Runs", exact: true });
        // The first page load waits on Vite's dependency optimizer, which a busy gate host can hold past 30 s.
        await runs.getByRole("row").nth(5).waitFor({ timeout: 120_000 });

        const facts = await page.evaluate(() => {
          const probe = (property, value) => { const el = document.createElement("i"); el.style[property] = value; document.body.append(el); const read = getComputedStyle(el)[property]; el.remove(); return read; };
          const frame = document.querySelector('[data-slot="data-table"]'), style = getComputedStyle(frame), th = frame.querySelector("thead th");
          const numeric = frame.querySelector('td[data-column="usd"]'), tries = frame.querySelector('td[data-column="tries"]');
          const statuses = [...frame.querySelectorAll(".tangle-data-status")].map((el) => ({ state: el.dataset.runStatus, mark: el.querySelector("svg").innerHTML, ink: getComputedStyle(el.querySelector("svg")).color }));
          const bars = [...frame.querySelectorAll(".tangle-data-bar")].map((el) => ({ track: el.querySelector(".tangle-data-bar-track").getBoundingClientRect().width, fill: el.querySelector(".tangle-data-bar-fill").getBoundingClientRect().width, share: parseFloat(el.style.getPropertyValue("--tangle-dt-bar")) / 100, empty: el.querySelector(".tangle-data-bar-fill").hasAttribute("data-empty") }));
          return {
            surface: style.backgroundColor, card: probe("backgroundColor", "hsl(var(--card))"), page: getComputedStyle(document.body).backgroundColor,
            border: style.borderTopWidth, radius: style.borderTopLeftRadius, cardRadius: probe("borderTopLeftRadius", "var(--radius-card)"), shadow: style.boxShadow,
            header: { size: getComputedStyle(th).fontSize, color: getComputedStyle(th).color, muted: probe("color", "hsl(var(--muted-foreground))") },
            numeric: { align: getComputedStyle(numeric).textAlign, digits: getComputedStyle(tries).fontVariantNumeric },
            statuses, bars,
            money: [...frame.querySelectorAll(".tangle-data-money")].slice(0, 4).map((el) => ({ text: el.textContent, unknown: el.hasAttribute("data-unknown") })),
            rows: frame.querySelectorAll("tbody tr").length,
            current: getComputedStyle(frame.querySelector('tbody tr[aria-current="true"] td')).backgroundColor, selected: probe("backgroundColor", "var(--ix-sel-bg)"),
            pageFits: document.documentElement.scrollWidth <= innerWidth,
          };
        });
        assert.equal(facts.surface, facts.card, "the table sits on the card plane");
        assert.notEqual(facts.surface, facts.page, "the card steps off the page");
        assert.equal(facts.border, "1px");
        assert.equal(facts.radius, facts.cardRadius);
        assert.match(facts.shadow, /rgba?\(/, "the card carries its elevation");
        assert.equal(facts.header.size, "12px");
        assert.equal(facts.header.color, facts.header.muted);
        assert.equal(facts.numeric.align, "end");
        assert.match(facts.numeric.digits, /tabular-nums/);
        assert.equal(facts.rows, 24);
        assert.deepEqual([...new Set(facts.statuses.map((status) => status.state))].sort(), [...STATES].sort(), "live, passed, failed, cancelled and queued map to five states");
        const marks = new Map(facts.statuses.map((status) => [status.state, status.mark]));
        assert.equal(new Set(marks.values()).size, STATES.length, "no two states share a glyph");
        const ink = new Map(facts.statuses.map((status) => [status.state, status.ink]));
        assert.equal(new Set(["running", "done", "failed"].map((state) => ink.get(state))).size, 3, "running, done and failed each have their own ink");
        for (const state of ["running", "done", "failed"]) assert.notEqual(ink.get(state), ink.get("stopped"), `${state} is not drawn neutral`);
        for (const bar of facts.bars) {
          if (bar.empty) continue;
          assert.ok(Math.abs(bar.fill - Math.max(2, bar.track * bar.share)) <= 1.5, `bar fill ${bar.fill} of ${bar.track} draws its share ${bar.share}`);
        }
        assert.ok(facts.bars.some((bar) => bar.empty), "an unmeasured run draws an empty track");
        assert.deepEqual(facts.money.map((money) => money.text), ["$0.42", "≥$1.79", "—API-equivalent not priced", "$4.53"]);
        assert.equal(facts.money[2].unknown, true, "an unpriced run is unknown, not zero");
        if (width > 390) assert.equal(facts.current, facts.selected, "the open row takes the selected wash");
        assert.equal(facts.pageFits, true, "no horizontal page scroll");

        const empty = page.getByRole("region", { name: "Empty runs" });
        assert.equal(await empty.getByRole("row").count(), 2);
        assert.equal(await empty.getByText("No runs yet").isVisible(), true);

        const boards = page.getByRole("region", { name: "Boards" });
        assert.equal(await boards.locator("thead th").first().evaluate((th) => getComputedStyle(th).fontSize), "13px", "a product with a 13px floor sets the small text once");
        const ledger = page.getByRole("table", { name: "Ledger" });
        assert.equal(await ledger.evaluate((table) => table.tabIndex), 0, "a virtual list's ARIA table is its own focusable scroller");
        assert.equal(await ledger.locator("[data-row]").first().evaluate((row) => getComputedStyle(row).borderTopWidth), "1px");
        const centred = await ledger.getByRole("columnheader").evaluateAll((cells) => cells.map((cell) => { const box = cell.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(cell); const text = range.getBoundingClientRect(); return Math.abs((text.top + text.bottom) / 2 - (box.top + box.bottom) / 2); }));
        assert.ok(centred.every((offset) => offset <= 1.5), `an ARIA header centres its label in its height: ${centred}`);
        const ledgerOpen = await ledger.locator('[data-row][data-state="selected"]').evaluate((row) => ({ row: getComputedStyle(row).backgroundColor, cell: getComputedStyle(row.firstElementChild).backgroundColor }));
        assert.equal(ledgerOpen.row, facts.selected, "an ARIA row, a grid with gaps, takes the selected tint as one block");
        assert.equal(ledgerOpen.cell, "rgba(0, 0, 0, 0)");

        if (width === 390) {
          const stacked = await runs.evaluate((region) => {
            const head = region.querySelector("thead"), row = region.querySelector("tbody tr"), cells = [...row.children];
            return { head: head.getBoundingClientRect().height, row: getComputedStyle(row).display, labels: cells.map((cell) => getComputedStyle(cell, "::before").content), primary: cells[0].getBoundingClientRect().width, rowWidth: row.getBoundingClientRect().width, scrolls: region.scrollWidth > region.clientWidth };
          });
          assert.ok(stacked.head <= 1, "the header row is read by assistive tech, not drawn, when rows stack");
          assert.equal(stacked.row, "grid");
          assert.deepEqual(stacked.labels, ["none", '"Ending"', '"Wall time"', '"Tries"', '"Best check"', '"API-equiv."']);
          assert.ok(stacked.primary >= stacked.rowWidth - 40, "the run name is the row's full-width title");
          assert.equal(stacked.scrolls, false, "a stacked table never scrolls sideways");
          const open = await runs.locator('tbody tr[aria-current="true"]').evaluate((row) => ({ row: getComputedStyle(row).backgroundColor, cell: getComputedStyle(row.children[1]).backgroundColor }));
          assert.equal(open.row, facts.selected, "a stacked open row takes the selected tint as one block");
          assert.equal(open.cell, "rgba(0, 0, 0, 0)");
          assert.equal(await page.getByRole("row").filter({ hasText: "procedure-census-matrix" }).first().isVisible(), true);
          const wide = await boards.evaluate((region) => ({ scrolls: region.scrollWidth > region.clientWidth, tab: region.tabIndex, title: region.querySelector("tbody td").getBoundingClientRect().width }));
          assert.ok(wide.title >= 80, `a scrolling table keeps whole words in a cell (${wide.title}px), not one letter a line`);
          assert.equal(wide.scrolls, true, "a wide scroll table scrolls inside its region");
          assert.equal(wide.tab, 0, "its region takes keyboard focus to scroll");
        } else {
          assert.equal(await runs.locator("tbody tr").first().evaluate((row) => getComputedStyle(row).display), "table-row");
          const header = runs.getByRole("columnheader", { name: /Wall time/ }), sort = runs.getByRole("button", { name: "Sort by Wall time" });
          for (const [key, expected] of [["Enter", "descending"], ["Space", "ascending"], ["Enter", "none"]]) {
            await sort.focus(); await sort.press(key);
            assert.equal(await header.getAttribute("aria-sort"), expected);
          }
          const row = runs.locator("tbody tr").nth(4), cell = row.locator("td").first();
          const before = await cell.evaluate((td) => getComputedStyle(td).backgroundColor);
          await row.hover();
          await page.waitForTimeout(200);
          const after = await cell.evaluate((td) => getComputedStyle(td).backgroundColor);
          const hover = await page.evaluate(() => { const el = document.createElement("i"); el.style.backgroundColor = "var(--ix-hover-bg)"; document.body.append(el); const read = getComputedStyle(el).backgroundColor; el.remove(); return read; });
          assert.notEqual(before, after, "a row answers the pointer");
          assert.equal(after, hover);
        }
        assert.deepEqual(errors, []);
        if (out) await page.screenshot({ path: resolve(out, `data-table-${theme}-${width}.png`), fullPage: true });
        cases.push({ theme, width, status: "PASS" });
      } finally { await context.close(); }
    }
  }
  console.log(JSON.stringify({ cases }));
  if (out) await writeFile(resolve(out, "receipt.json"), JSON.stringify({ cases }, null, 2));
} finally { await browser.close(); await server.close(); }
