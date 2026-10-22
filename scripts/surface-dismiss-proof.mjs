import { designServer } from "./design-contract-server.mjs";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { calibratePresentedFeedback, measurePresentedFeedback } from "./lib/presented-feedback.mjs";
const withFeedback = process.argv.includes("--feedback");
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
      await context.tracing.start({screenshots:true,snapshots:true,sources:true});
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
      let feedback;
      if (withFeedback) {
        const budgetMs = await page.evaluate(async () => {
          const { interactionBudgets } = await import("/packages/ui/src/lib/code-presentation.ts");
          return interactionBudgets(document.body).feedback;
        });
        if (!Number.isFinite(budgetMs)) throw Error("Installed Brand feedback role is unresolved");
        const calibrationPage = await context.newPage();
        const calibration = await calibratePresentedFeedback(calibrationPage, {
          directory: `${out}/${kind}-${width}-${reducedMotion}-calibration`,
          fixture: await readFile(new URL("./fixtures/feedback-calibration.html", import.meta.url), "utf8"),
          delayedMs: budgetMs * 2, spacingMs: budgetMs * 4,
        });
        await calibrationPage.close();
        const feedbackTarget = kind === "popover" ? content.getByRole("textbox")
          : kind === "dialog" || kind === "sheet" ? content.getByRole("heading") : content;
        const bounds = await feedbackTarget.boundingBox();
        // Observe glyphs or the field border, never a blinking text caret.
        const region = kind === "popover"
          ? { x: Math.floor(bounds.x), y: Math.floor(bounds.y + bounds.height / 2), width: 4, height: 4 }
          : { x: Math.floor(bounds.x + 2), y: Math.floor(bounds.y + 2), width: Math.min(32, Math.floor(bounds.width - 2)), height: Math.min(20, Math.floor(bounds.height - 2)) };
        const measurement = await measurePresentedFeedback(page, {
          directory: `${out}/${kind}-${width}-${reducedMotion}-feedback`, label: `${kind}-native-Escape`,
          input: { type: "keydown", target: kind === "tooltip" ? trigger : content },
          prepare: async () => { await page.bringToFront(); await page.evaluate(async () => {
            await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
          }); },
          act: () => page.keyboard.press("Escape"),
          region,
          settleMs: budgetMs * 4,
          verify: () => page.evaluate(() => !window.dismissProbe.node.isConnected && document.activeElement === window.dismissProbe.trigger && document.body.style.pointerEvents !== "none"),
        });
        feedback = { calibration, budgetMs, measurement, scope: "Individual native-dismissal observation; not two40-attempt batch acceptance" };
        if (!calibration.pass || measurement.status !== "OBSERVED") failure = "Feedback capture/calibration did not qualify";
      } else await page.keyboard.press("Escape");
      try {
        await page.waitForFunction(() => !window.dismissProbe.node.isConnected && document.activeElement === window.dismissProbe.trigger && document.body.style.pointerEvents !== "none", null, { timeout: 1000 });
      } catch { failure = "Dismissal/focus stranded when CSS end/cancel events are withheld (1s diagnostic ceiling, not a latency budget)."; }
      const actual = await page.evaluate(() => ({ connected: window.dismissProbe.node.isConnected, state: window.dismissProbe.node.dataset.state, focusReturned: document.activeElement === window.dismissProbe.trigger, pointerEvents: document.body.style.pointerEvents, events: window.dismissProbe.events }));
      if (errors.length) failure = errors.join("; ");
      await page.screenshot({ path: `${out}/${kind}-${width}-${reducedMotion}-closed.png` });
      cases.push({ width, reducedMotion, kind, pass: !failure, failure, actual, feedback, video: `videos/${basename(await page.video().path())}` });
    } finally {
      await context.tracing.stop({path:`${out}/${kind}-${width}-${reducedMotion}-trace.zip`});
      await context.close();
      await writeFile(`${out}/partial.json`, JSON.stringify({ cases }, null, 2));
    }
  }
  const receipt = { sha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), at: new Date().toISOString(), scope: withFeedback
    ? "Isolated real Radix/Motion fixture with calibrated individual CDP image frame-swap feedback observations. No two40-attempt acceptance or production claim."
    : "Isolated real Radix/Motion fixture; CSS end/cancel delivery withheld. No presented-frame latency or production claim.", cases };
  await writeFile(`${out}/receipt.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ sha: receipt.sha, passed: cases.filter(row => row.pass).length, failed: cases.filter(row => !row.pass).length, receipt: `${out}/receipt.json` }));
  if (cases.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); await server.close(); }
