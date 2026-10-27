import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "playwright/test"

// Speaker headers in a real browser, at desktop and phone width in both
// themes: every header stays on one line, a long name and handle truncate
// while the state stays whole, an ordinary name never truncates before its
// handle does, and nothing scrolls the page sideways.
// Screenshots go to SPEAKER_SHOTS_DIR when it is set.

const VIEWPORTS = { desktop: { width: 1280, height: 800 }, phone: { width: 390, height: 844 }, small: { width: 360, height: 740 } }
const STORIES = ["answering-at-once", "stored-with-failure", "long-names"]

for (const story of STORIES) {
  for (const theme of ["light", "dark"]) {
    for (const [width, viewport] of Object.entries(VIEWPORTS)) {
      test(`${story} ${theme} ${width}`, async ({ page }) => {
        const errors = []
        page.on("pageerror", (error) => errors.push(error.message))
        await page.setViewportSize(viewport)
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
        await page.goto(`/iframe.html?id=chat-speakers--${story}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" })
        const headers = page.locator("[data-speaker-state]")
        await headers.first().waitFor({ state: "visible", timeout: 30_000 })
        await page.evaluate(() => document.fonts.ready)

        expect(errors).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
        for (const header of await headers.all()) {
          const box = await header.boundingBox()
          expect(box.height).toBeLessThanOrEqual(24)
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
          // A name of ordinary length stays whole; the handle gives way first.
          const name = header.locator("span[title]").first()
          if ((await name.textContent()).length <= 20) expect(await name.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
          const state = await header.getAttribute("data-speaker-state")
          if (state !== "done") {
            const label = header.getByText(state === "failed" ? "Failed" : "Answering", { exact: true })
            const labelBox = await label.boundingBox()
            expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(viewport.width - 16)
            expect(await label.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
          }
        }

        const dir = process.env.SPEAKER_SHOTS_DIR
        if (dir) {
          mkdirSync(dir, { recursive: true })
          await page.screenshot({ path: join(dir, `${story}-${theme}-${width}.png`), fullPage: true })
        }
      })
    }
  }
}
