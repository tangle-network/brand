/** Run against a rendered workbench with a long streaming example, e.g. sandboxes/fix-and-commit. */
import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const url = process.argv[2];
assert.ok(url, "Pass a served URL for a long recorded example.");
const metrics = el => ({
  top: el.scrollTop,
  gap: el.scrollHeight - el.clientHeight - el.scrollTop,
  page: Math.round(window.scrollY),
  pageHeight: document.documentElement.scrollHeight,
});

async function check(browserType, width) {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height: width < 500 ? 844 : 900 }, hasTouch: width < 500, isMobile: width < 500 });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const root = page.locator(".qs-workbench");
    const trigger = root.locator(".qs-picker button");
    const feed = root.getByRole("region", { name: "Run" });
    const run = root.getByRole("button", { name: "Play the recorded run" });
    await trigger.waitFor();
    await run.waitFor();
    await trigger.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .6, behavior: "instant" }));
    const before = await feed.evaluate(metrics);
    const idle = feed.locator("[data-timeline-step]").last();
    await idle.waitFor();
    const end = await idle.evaluate(el => el.closest(".qs-feed").getBoundingClientRect().bottom - el.getBoundingClientRect().bottom);
    assert.ok(end >= 0 && end < 20, "A short trace rests on its bottom inset");

    if (width < 500) await trigger.tap(); else await trigger.click();
    await page.getByRole("menu").waitFor();
    assert.equal(await page.evaluate(() => document.body.hasAttribute("data-scroll-locked")), false);
    const options = await page.getByRole("menuitemradio").allTextContents();
    const phrase = options.find(title => title.trim().split(/\s+/).length >= 3)?.trim();
    if (phrase) {
      await page.evaluate(() => {
        function captureSpace(event) {
          if (event.key !== ' ') return;
          document.body.dataset.typeaheadSpace = String(event.defaultPrevented);
          document.removeEventListener('keydown', captureSpace);
        }
        document.addEventListener('keydown', captureSpace);
      });
      await page.keyboard.type(phrase, { delay: 40 });
      await page.waitForFunction(title => document.activeElement?.textContent?.trim() === title, phrase);
      assert.equal(await page.locator('body').getAttribute('data-typeahead-space'), 'true');
      assert.equal((await feed.evaluate(metrics)).page, before.page, 'Multiword search stays in the picker');
    }
    await page.keyboard.press("End");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.matches(".qs-picker button"));
    const closed = await feed.evaluate(metrics);
    assert.equal(closed.page, before.page);
    assert.equal(closed.pageHeight, before.pageHeight);

    // A reader can reach the transport before a quarter of the workbench has entered the viewport.
    await run.evaluate(button => window.scrollTo({ top: scrollY + button.getBoundingClientRect().bottom - innerHeight + 8, behavior: 'instant' }));
    const partial = await root.locator('.qs-main').evaluate(el => ({
      ratio: (innerHeight - el.getBoundingClientRect().top) / el.clientHeight,
      page: Math.round(scrollY),
    }));
    assert.ok(partial.ratio > 0 && partial.ratio < .25);
    if (width < 500) await run.tap(); else await run.click();
    await root.locator('.qs-main[data-state="running"]').waitFor({ timeout: 3000 });
    assert.equal(Math.round(await page.evaluate(() => scrollY)), partial.page, 'Play preserves the reader’s page position');
    await root.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().bottom + 8, behavior: 'instant' }));
    await root.locator('.qs-main[data-state="paused"]').waitFor({ timeout: 3000 });
    // Move the feed into view before measuring. Follow always belongs to the feed.
    await feed.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 72, behavior: "instant" }));
    const watching = await feed.evaluate(metrics);
    await page.waitForFunction(() => {
      const el = document.querySelector(".qs-workbench .qs-feed");
      return el.scrollHeight > el.clientHeight + 130 && el.scrollHeight - el.clientHeight - el.scrollTop < 3;
    });
    await feed.evaluate(el => el.focus({ preventScroll: true }));
    await page.keyboard.press('Home');
    await page.waitForFunction(() => document.querySelector('.qs-workbench .qs-feed').scrollTop < 2);
    const oldHeight = await feed.evaluate(el => el.scrollHeight);
    const away = await feed.evaluate(metrics);
    await page.waitForFunction(h => document.querySelector(".qs-workbench .qs-feed").scrollHeight > h + 16, oldHeight);
    assert.ok(Math.abs((await feed.evaluate(metrics)).top - away.top) <= 2, "New content must not steal a reader's position");
    const resumedHeight = await feed.evaluate(el => {
      // Sample after the scroller's handler, before native keyboard scrolling or the next streaming frame.
      document.addEventListener('keydown', event => {
        el.dataset.endKey = JSON.stringify({ handled: event.defaultPrevented, gap: el.scrollHeight - el.clientHeight - el.scrollTop });
      }, { once: true });
      return el.scrollHeight;
    });
    await page.keyboard.press('End');
    const endKey = JSON.parse(await feed.getAttribute('data-end-key'));
    assert.ok(endKey.handled && Math.abs(endKey.gap) < 3, 'A focused End must reattach immediately at the current height');
    await page.waitForFunction(h => {
      const el = document.querySelector(".qs-workbench .qs-feed");
      return el.scrollHeight > h + 16 && el.scrollHeight - el.clientHeight - el.scrollTop < 3;
    }, resumedHeight);
    await root.locator('.qs-main[data-state="ended"]').waitFor({ timeout: 35000 });
    const finished = await feed.evaluate(metrics);
    assert.ok(finished.gap < 3, "Following survives repeated streamed growth through the final output");
    assert.equal(finished.page, watching.page);
    console.log(JSON.stringify({ width, idleBottomInset: Math.round(end), documentScrollOnMenu: closed.page - before.page,
      unpinnedGap: Math.round(away.gap), resumedGap: Math.round((await feed.evaluate(metrics)).gap) }));
  } finally {
    await browser.close();
  }
}

await Promise.all([check(chromium, 1440), check(webkit, 390)]);
