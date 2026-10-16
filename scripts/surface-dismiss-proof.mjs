import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { execFileSync } from "node:child_process";
const out = resolve(process.env.DESIGN_EVIDENCE ?? "/tmp/brand-dismiss-evidence");
await mkdir(out, { recursive: true });
const { server, url } = await designServer(), browser = await chromium.launch({ headless: true }), cases = [];
try {
  for (const width of [390, 1440]) for (const reducedMotion of ["no-preference", "reduce"]) for (const kind of ["dialog", "sheet", "popover", "tooltip"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion, recordVideo: { dir: `${out}/videos` } });
    const page = await context.newPage(), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    let failure;
    try {
      await page.goto(`${url}?surface=motion&theme=light`, { waitUntil: "networkidle" });
      const trigger = page.getByRole("button", { name: kind === "tooltip" ? "Hint" : `Open ${kind}`, exact: true });
      await trigger.focus();
      await trigger.evaluate(node => { window.dismissTrigger = node; });
      if (kind === "tooltip") await trigger.hover(); else await trigger.press("Enter");
      const content = kind === "tooltip" ? page.getByText("Tooltip surface", { exact: true }).first() : page.getByRole("dialog");
      await content.waitFor();
      await content.evaluate(node => {
        window.dismissProbe = { node, trigger: window.dismissTrigger, events: [] };
        // Keep the real CSS/Motion running; withhold lifecycle events from Radix.
        for (const type of ["animationend", "animationcancel"]) document.addEventListener(type, event => {
          if (event.target === node) { window.dismissProbe.events.push({ type, at: performance.now(), withheld: true }); event.stopImmediatePropagation(); }
        }, true);
        const observer = new MutationObserver(() => {
          if (!node.isConnected) { window.dismissProbe.events.push({ type: "detach", at: performance.now() }); observer.disconnect(); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
      await page.screenshot({ path: `${out}/${kind}-${width}-${reducedMotion}-open.png` });
      await page.keyboard.press("Escape");
      try {
        await page.waitForFunction(() => !window.dismissProbe.node.isConnected && document.activeElement === window.dismissProbe.trigger && document.body.style.pointerEvents !== "none", null, { timeout: 1000 });
      } catch { failure = "Dismissal/focus stranded when CSS end/cancel events are withheld (1s diagnostic ceiling, not a latency budget)."; }
      const actual = await page.evaluate(() => ({ connected: window.dismissProbe.node.isConnected, state: window.dismissProbe.node.dataset.state, focusReturned: document.activeElement === window.dismissProbe.trigger, pointerEvents: document.body.style.pointerEvents, events: window.dismissProbe.events }));
      if (errors.length) failure = errors.join("; ");
      await page.screenshot({ path: `${out}/${kind}-${width}-${reducedMotion}-closed.png` });
      cases.push({ width, reducedMotion, kind, pass: !failure, failure, actual, video: `videos/${basename(await page.video().path())}` });
    } finally {
      await context.close();
      await writeFile(`${out}/partial.json`, JSON.stringify({ cases }, null, 2));
    }
  }
  const receipt = { sha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), at: new Date().toISOString(), scope: "Isolated real Radix/Motion fixture; CSS end/cancel delivery withheld. No presented-frame latency or production claim.", cases };
  await writeFile(`${out}/receipt.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ sha: receipt.sha, passed: cases.filter(row => row.pass).length, failed: cases.filter(row => !row.pass).length, receipt: `${out}/receipt.json` }));
  if (cases.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); await server.close(); }
