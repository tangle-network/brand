import { expect, test } from "playwright/test"

// A phone-width strip with more options than fit must show that it scrolls,
// keep the selected option fully visible and clear of the scroll cue, and
// scroll by cue, wheel or touch pan, and keyboard.

const PHONE = { width: 390, height: 844 }

// Screenshots are evidence, not assertions: a loaded host can stall the frame a screenshot waits for, so cap
// it and keep the test's verdict on the geometry checks.
async function shot(page, path) {
  try { await page.screenshot({ path, timeout: 15_000 }) }
  catch (error) { if (error?.name !== "TimeoutError") throw error; console.log(`screenshot skipped: ${path}`) }
}

async function openStory(page, id, theme) {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize(PHONE)
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" })
  await page.locator('[role="radiogroup"]').first().waitFor({ state: "visible", timeout: 30_000 })
  // Let web fonts settle so option widths are final.
  await page.evaluate(() => document.fonts.ready)
  return errors
}

const rect = (locator) => locator.evaluate((node) => {
  const r = node.getBoundingClientRect()
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
})

async function visibleCues(strip) {
  const cues = strip.locator("[data-scroll-cue]")
  const out = []
  for (let i = 0; i < (await cues.count()); i++) {
    if (await cues.nth(i).isVisible()) out.push(await rect(cues.nth(i)))
  }
  return out
}

async function expectSelectedClear(strip) {
  const selected = strip.locator('[role="radio"][aria-checked="true"]')
  const s = await rect(selected)
  const box = await rect(strip)
  expect(s.left, "selected option starts inside the strip").toBeGreaterThanOrEqual(box.left - 0.5)
  expect(s.right, "selected option ends inside the strip").toBeLessThanOrEqual(box.right + 0.5)
  for (const cue of await visibleCues(strip)) {
    const overlap = Math.min(s.right, cue.right) - Math.max(s.left, cue.left)
    expect(overlap, `a scroll cue covers the selected option: option ${JSON.stringify(s)} cue ${JSON.stringify(cue)}`).toBeLessThanOrEqual(0)
  }
}

for (const theme of ["light", "dark"]) {
  test(`eight tabs at 390 px show a scroll cue and keep the selected tab in view (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-segmentedcontrol--overflowing-tabs", theme)
    const strip = page.getByTestId("overflow-tabs")
    const metrics = await strip.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }))
    expect(metrics.scrollWidth, "the tab strip overflows and scrolls").toBeGreaterThan(metrics.clientWidth)
    await shot(page, testInfo.outputPath(`tabs-${theme}.png`))

    const box = await rect(strip)
    const cues = await visibleCues(strip)
    expect(cues.length, "a visible cue marks tabs past the edge").toBeGreaterThan(0)
    for (const cue of cues) {
      expect(cue.left).toBeGreaterThanOrEqual(box.left - 0.5)
      expect(cue.right).toBeLessThanOrEqual(box.right + 0.5)
    }
    await expectSelectedClear(strip)

    // Keyboard: End selects the last tab and the strip follows it.
    await strip.locator('[role="radio"][aria-checked="true"]').focus()
    await page.keyboard.press("End")
    await expect(strip.locator('[role="radio"][aria-checked="true"]')).toHaveText("People")
    await expectSelectedClear(strip)
    await expect(strip.locator('[data-scroll-cue="end"]')).toHaveCount(0)
    await expect(strip.locator('[data-scroll-cue="start"]')).toBeVisible()

    // Home goes back and the start cue clears.
    await page.keyboard.press("Home")
    await expect(strip.locator('[role="radio"][aria-checked="true"]')).toHaveText("Today")
    await expectSelectedClear(strip)
    await expect(strip.locator('[data-scroll-cue="start"]')).toHaveCount(0)
    await expect(strip.locator('[data-scroll-cue="end"]')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, "the page itself never scrolls sideways").toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
  })

  test(`a scrolling row at 390 px pages by cue and by wheel or touch pan (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-segmentedcontrol--overflowing-row", theme)
    const strip = page.getByTestId("overflow-row")
    const scrollLeft = () => strip.evaluate((node) => node.scrollLeft)
    expect(await strip.evaluate((node) => node.scrollWidth > node.clientWidth), "the row overflows").toBe(true)
    await shot(page, testInfo.outputPath(`row-${theme}.png`))
    await expectSelectedClear(strip)

    const end = strip.locator('[data-scroll-cue="end"]')
    await expect(end, "a visible cue marks options past the edge").toBeVisible()
    await end.click()
    await expect.poll(scrollLeft, { message: "the end cue scrolls the row forward" }).toBeGreaterThan(0)
    await expect(strip.locator('[data-scroll-cue="start"]')).toBeVisible()

    await strip.evaluate((node) => { node.scrollLeft = 0 })
    await strip.hover()
    await page.mouse.wheel(120, 0)
    await expect.poll(scrollLeft, { message: "a horizontal wheel or pan scrolls the row" }).toBeGreaterThan(0)
    expect(errors).toEqual([])
  })
}
