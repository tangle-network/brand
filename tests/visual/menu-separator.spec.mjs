import { expect, test } from "playwright/test"

// WCAG relative luminance of an `rgb()`/`color(srgb …)` computed colour.
const luminance = (css) => {
  const parts = css.match(/[\d.]+/g).map(Number)
  const rgb = css.startsWith("color(") ? parts.slice(0, 3) : parts.slice(0, 3).map((v) => v / 255)
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

for (const theme of ["light", "dark"]) {
  test(`a menu separator stays visible on the ${theme} popover`, async ({ page }, testInfo) => {
    await page.goto(`/iframe.html?id=primitives-dropdownmenu--default&viewMode=story&globals=theme:${theme}`)
    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    const colors = await menu.evaluate((node) => ({
      surface: getComputedStyle(node).backgroundColor,
      line: getComputedStyle(node.querySelector('[role="separator"]')).backgroundColor,
    }))
    const [hi, lo] = [luminance(colors.line), luminance(colors.surface)].sort((a, b) => b - a)
    const contrast = (hi + 0.05) / (lo + 0.05)
    await testInfo.attach("separator", { body: JSON.stringify({ theme, ...colors, contrast }), contentType: "application/json" })
    await menu.screenshot({ path: testInfo.outputPath(`separator-${theme}.png`) })
    expect(contrast, `${colors.line} on ${colors.surface}`).toBeGreaterThanOrEqual(1.5)
  })
}
