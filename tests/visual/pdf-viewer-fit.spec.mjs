import { expect, test } from "playwright/test"

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.5 })

test("large plot sheets fit the phone and return to responsive fit after manual zoom", async ({ page }) => {
  await page.goto("/iframe.html?id=files-pdfviewer--wide-plot&viewMode=story")
  const reader = page.getByRole("region", { name: "Plot calibration.pdf" })
  const canvas = reader.getByRole("img", { name: "Page 1 of 6" }).locator("canvas")
  const zoomIn = page.getByRole("button", { name: "Zoom in" })
  const zoomOut = page.getByRole("button", { name: "Zoom out" })
  const fit = page.getByRole("button", { name: /fit to width/ })

  async function expectFit() {
    await expect(canvas).toBeVisible()
    await expect(fit).toHaveAttribute("aria-pressed", "true")
    await expect.poll(() => reader.evaluate(el => el.scrollWidth - el.clientWidth)).toBe(0)
    await expect.poll(async () => Math.abs(
      await reader.evaluate(el => el.clientWidth - 24) - (await canvas.boundingBox()).width,
    )).toBeLessThanOrEqual(1)
    await expect(zoomOut).toBeDisabled()
  }

  await expectFit()
  await zoomIn.click()
  await expect(fit).toHaveAccessibleName("25%, fit to width")
  await expect.poll(() => reader.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(500)
  await zoomOut.click()
  await expectFit()

  await zoomIn.click()
  await fit.click()
  await page.setViewportSize({ width: 540, height: 780 })
  await expectFit()
})
