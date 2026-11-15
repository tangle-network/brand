import { expect, test } from "playwright/test"

// A reasoning row whose whole text is "391." renders an ordered list that
// starts at 391. The row's body clips overflow, so the list's inline-start
// gutter must hold the widest marker ("391. "), or the clip cuts its first
// digits (production 2026-11-14: the panel read ")1.").

const VIEWPORTS = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 } }

for (const [viewport, size] of Object.entries(VIEWPORTS)) {
  test(`a three-digit list marker stays inside the reasoning row's clip, ${viewport}`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/iframe.html?id=run-inlinethinkingitem--numbered-answer&viewMode=story", { waitUntil: "load" })
    const list = page.locator("[data-run-row] ol")
    await expect(list).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const fit = await list.evaluate((ol) => {
      const items = ol.querySelectorAll(":scope > li")
      const li = items[0]
      const style = getComputedStyle(li)
      const context = document.createElement("canvas").getContext("2d")
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const marker = `${ol.start + items.length - 1}. `
      const clip = ol.parentElement.closest(".overflow-hidden")
      return {
        marker,
        markerPx: context.measureText(marker).width,
        gutterPx: li.getBoundingClientRect().left - clip.getBoundingClientRect().left,
      }
    })
    expect(fit.marker).toBe("391. ")
    expect(fit.gutterPx, `gutter ${fit.gutterPx}px holds marker ${fit.markerPx}px`).toBeGreaterThanOrEqual(fit.markerPx)
  })
}
