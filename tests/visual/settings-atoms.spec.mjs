import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "playwright/test"

// The settings atoms in a real browser: PageShell measure="settings" switches
// its navigation on the frame's own width, rows stack below 34rem of card,
// list columns line up, messages are wired to their controls, nothing drops
// under 14px, and the phone strip keeps the current tab in view by scrolling
// the strip only. Screenshots go to SETTINGS_SHOTS_DIR when it is set.

const DESKTOP = { width: 1280, height: 900 }
const SPLIT = { width: 820, height: 900 }
const PHONE = { width: 390, height: 844 }

async function shot(page, testInfo, name, options = {}) {
  const dir = process.env.SETTINGS_SHOTS_DIR
  if (dir) mkdirSync(dir, { recursive: true })
  const path = dir ? join(dir, name) : testInfo.outputPath(name)
  try { await page.screenshot({ path, timeout: 15_000, ...options }) }
  catch (error) { if (error?.name !== "TimeoutError") throw error; console.log(`screenshot skipped: ${path}`) }
}

async function openStory(page, id, theme, viewport) {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize(viewport)
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" })
  await page.locator('[role="region"], [data-slot="card"]').first().waitFor({ state: "visible", timeout: 30_000 })
  await page.evaluate(() => document.fonts.ready)
  return errors
}

const box = (locator) => locator.evaluate((node) => {
  const r = node.getBoundingClientRect()
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
})

/** Visible text under 14px anywhere in the story root. */
const smallText = (page) => page.evaluate(() => {
  const root = document.querySelector("#storybook-root")
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const out = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!node.textContent.trim()) continue
    const element = node.parentElement
    const style = getComputedStyle(element)
    if (style.visibility === "hidden" || element.getClientRects().length === 0) continue
    const size = Number.parseFloat(style.fontSize)
    if (size < 14) out.push({ text: node.textContent.trim().slice(0, 40), size })
  }
  return out
})

const pageOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

const row = (page, label) => page.locator('[data-layout]').filter({ has: page.getByText(label, { exact: true }) }).first()

async function expectDescribedBy(control, message) {
  const id = await message.getAttribute("id")
  expect(id, "the message has an id").toBeTruthy()
  expect((await control.getAttribute("aria-describedby")) ?? "", "the control is described by its row's message").toContain(id)
}

for (const theme of ["light", "dark"]) {
  test(`settings page at 1280 px: column nav, side-by-side rows, aligned lists (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-settings--page", theme, DESKTOP)
    await shot(page, testInfo, `page-1280-${theme}.png`, { fullPage: true })

    const nav = page.getByRole("navigation", { name: "Settings sections" })
    const article = page.locator(".tangle-reading-article")
    const navBox = await box(nav)
    const articleBox = await box(article)
    expect(navBox.width, "the nav is the 13rem column").toBeCloseTo(208, 0)
    expect(navBox.right, "the nav sits beside the article").toBeLessThan(articleBox.left)
    expect(articleBox.width, "the article is at most 48rem").toBeLessThanOrEqual(768.5)
    expect(await nav.evaluate((node) => getComputedStyle(node).position)).toBe("sticky")
    const current = nav.locator('a[aria-current="page"]')
    await expect(current).toHaveText(/Team/)
    expect(await current.evaluate((node) => getComputedStyle(node).height)).toBe("36px")

    // Inline rows: label left, control right; the status sits on the label's line.
    const name = row(page, "Project name")
    const label = name.locator("label")
    const input = page.locator("#project-name")
    expect((await box(input)).left, "control right of the label").toBeGreaterThan((await box(label)).right)
    const status = name.getByText("Saved")
    expect(Math.abs((await box(status)).top - (await box(label)).top), "status on the label line").toBeLessThan(4)
    expect((await box(input)).height, "controls keep the md size").toBe(36)

    // Error: announced, replaces the description, describes the control, marks it invalid, offers Retry.
    const hour = row(page, "Digest hour")
    const alert = hour.getByRole("alert")
    await expect(alert).toContainText("Couldn't save the digest hour.")
    await expect(alert.getByRole("button", { name: "Retry" })).toBeVisible()
    await expectDescribedBy(page.locator("#digest-hour"), alert)
    await expect(page.locator("#digest-hour")).toHaveAttribute("aria-invalid", "true")

    // Lock reason replaces the description and describes the disabled control.
    const phone = row(page, "Texting phone")
    const reason = phone.getByText("Only Priya, the owner, can change the texting phone.")
    await expect(reason).toBeVisible()
    await expect(phone.locator("svg.lucide-lock")).toBeVisible()
    await expectDescribedBy(page.locator("#texting-phone"), phone.locator("#texting-phone-message"))
    await expect(page.locator("#texting-phone")).toBeDisabled()

    // A description describes its control too.
    await expectDescribedBy(page.locator("#instructions"), page.locator("#instructions-message"))

    // The info tip opens on focus with 14px text.
    const tip = row(page, "Timezone").getByRole("button", { name: "About Timezone" })
    await tip.focus()
    const tooltip = page.getByRole("tooltip")
    await expect(tooltip).toContainText("Dates in chats")
    expect(await page.locator("[data-radix-popper-content-wrapper] > *").first().evaluate((node) => getComputedStyle(node).fontSize)).toBe("14px")
    await shot(page, testInfo, `info-tip-1280-${theme}.png`)
    await page.keyboard.press("Escape")

    // List columns line up across items, and the title is the link.
    const jobs = page.getByRole("list", { name: "Automations" }).locator(":scope > li")
    await expect(jobs).toHaveCount(3)
    const menuRights = []
    for (let i = 0; i < 3; i++) menuRights.push(Math.round((await box(jobs.nth(i).getByRole("button", { name: /More actions/ }))).right))
    expect(new Set(menuRights).size, "menu buttons end on one line").toBe(1)
    const card = await box(page.getByRole("region", { name: "Automations" }))
    expect(card.right - menuRights[0], "the last column keeps the card's 20px inset").toBeCloseTo(21, 0)
    await expect(jobs.first().getByRole("link", { name: "Weekly competitor scan" })).toBeVisible()
    await expect(jobs.nth(2).getByRole("alert")).toContainText("Platform didn't respond")
    const statusLefts = []
    for (let i = 0; i < 3; i++) statusLefts.push(Math.round((await box(jobs.nth(i).getByText(["Active", "Paused", "Couldn't start"][i], { exact: true }))).left))
    expect(new Set(statusLefts).size, "states share a column").toBe(1)

    // The at-rest action reads as a control: a bordered button in another colour than the state beside it.
    const look = (locator) => locator.evaluate((node) => {
      const style = getComputedStyle(node)
      return { color: style.color, border: style.borderTopWidth, borderColor: style.borderTopColor }
    })
    const pause = await look(jobs.first().getByRole("button", { name: "Pause" }))
    const active = await look(jobs.first().getByText("Active", { exact: true }))
    expect(pause.border, "the action has a border").toBe("1px")
    expect(pause.borderColor, "the action's border is drawn").not.toBe("rgba(0, 0, 0, 0)")
    expect(active.border, "the state has none").toBe("0px")
    expect(pause.color, "the action and the state differ in colour").not.toBe(active.color)

    // A locked action stays focusable, is described by its reason under the meta, and does nothing.
    const triage = jobs.nth(1)
    const resume = triage.getByRole("button", { name: "Resume" })
    await expect(resume).toHaveAttribute("aria-disabled", "true")
    await expect(triage.getByText("Only Priya, the owner, can resume it.")).toBeVisible()
    await expect(triage.locator("svg.lucide-lock")).toBeVisible()
    const reasonId = await resume.getAttribute("aria-describedby")
    await expect(page.locator(`[id="${reasonId}"]`), "the button is described by its reason").toHaveText("Only Priya, the owner, can resume it.")
    await resume.focus()
    await expect(resume).toBeFocused()
    await page.keyboard.press("Enter")
    await resume.click({ force: true })
    await expect(triage.getByText("Paused", { exact: true }), "the locked Resume did nothing").toBeVisible()

    // The ⋯ menu: destructive in danger text; an unavailable item stays focusable with its reason and does nothing.
    const more = triage.getByRole("button", { name: "More actions Inbound lead triage" })
    await more.focus()
    await page.keyboard.press("Enter")
    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    const locked = menu.getByRole("menuitem", { name: /Delete/ })
    await expect(locked).toHaveAttribute("aria-disabled", "true")
    await expect(locked).toContainText("Only Priya, the owner, can delete it.")
    await shot(page, testInfo, `menu-1280-${theme}.png`)
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await expect(locked).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(menu, "selecting an unavailable item does nothing").toBeVisible()
    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect(more, "focus returns to the trigger").toBeFocused()

    // A danger section: danger edge and title.
    const danger = page.getByRole("region", { name: "Delete project" })
    const colors = await danger.evaluate((node) => ({ border: getComputedStyle(node).borderTopColor, title: getComputedStyle(node.querySelector("h2")).color }))
    expect(colors.border).not.toBe(await page.getByRole("region", { name: "General" }).evaluate((node) => getComputedStyle(node).borderTopColor))
    expect(colors.title).not.toBe(await page.getByRole("region", { name: "General" }).evaluate((node) => getComputedStyle(node.querySelector("h2")).color))

    // Delete project at rest is an outline button in the danger tone: danger text and edge on the card, no fill.
    const deleteButton = await danger.getByRole("button", { name: "Delete project…" }).evaluate((node) => {
      const style = getComputedStyle(node)
      return { color: style.color, border: style.borderTopColor, background: style.backgroundColor }
    })
    const editBrief = await page.getByRole("button", { name: "Edit brief" }).evaluate((node) => {
      const style = getComputedStyle(node)
      return { border: style.borderTopColor, background: style.backgroundColor }
    })
    expect(deleteButton.color, "danger text").toBe(colors.title)
    expect(deleteButton.border, "danger edge").toBe(colors.border)
    expect(deleteButton.background, "the outline's card fill, not the destructive fill").toBe(editBrief.background)

    // An unlocked action runs: Pause turns the first automation off.
    await jobs.first().getByRole("button", { name: "Pause" }).click()
    await expect(jobs.first().getByText("Paused", { exact: true })).toBeVisible()
    await expect(jobs.first().getByRole("button", { name: "Resume" })).toBeVisible()


    expect(await smallText(page), "no visible text under 14px").toEqual([])
    expect(await pageOverflow(page), "no sideways page scroll").toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
  })

  test(`settings page at 390 px: tab strip, stacked rows, two-line lists (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-settings--page", theme, PHONE)
    await shot(page, testInfo, `page-390-${theme}.png`, { fullPage: true })

    const nav = page.getByRole("navigation", { name: "Settings sections" })
    const navBox = await box(nav)
    expect(navBox.height, "the strip is ShellHeader height").toBe(56)
    expect(navBox.left, "the strip is full bleed").toBeLessThanOrEqual(0.5)
    expect(navBox.right).toBeGreaterThanOrEqual(PHONE.width - 0.5)
    const metrics = await nav.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, scrollLeft: node.scrollLeft }))
    expect(metrics.scrollWidth, "the strip overflows").toBeGreaterThan(metrics.clientWidth)
    expect(metrics.scrollLeft, "the strip scrolled to the current tab").toBeGreaterThan(0)
    const current = nav.locator('a[aria-current="page"]')
    const tab = await box(current)
    expect(tab.left, "current tab in view, clear of the edge").toBeGreaterThanOrEqual(navBox.left + 16)
    expect(tab.right).toBeLessThanOrEqual(navBox.right - 16)
    const scrolled = await nav.evaluate((node) => ({ left: node.scrollLeft, max: node.scrollWidth - node.clientWidth }))
    const centred = Math.abs((tab.left + tab.right) / 2 - (navBox.left + navBox.right) / 2) < 2
    expect(centred || Math.abs(scrolled.left - scrolled.max) < 1, "current tab centred, or the strip is at its end").toBe(true)
    expect(tab.height, "tabs are 44px").toBe(44)
    expect(await page.evaluate(() => [window.scrollX, window.scrollY]), "only the strip scrolled, never the page").toEqual([0, 0])
    await expect(nav.locator("svg").first(), "icons show only in the column").toBeHidden()

    // Inline rows stack with the control full width; compact rows stay on one line.
    const name = row(page, "Project name")
    const nameBox = await box(name)
    const input = await box(page.locator("#project-name"))
    expect(input.top, "control under the label").toBeGreaterThan((await box(name.locator("label"))).bottom)
    expect(input.width, "control spans the row").toBeCloseTo(nameBox.width - 32, 0)
    const digest = row(page, "Daily digest")
    const sw = await box(page.locator("#digest"))
    const swLabel = await box(digest.locator("label"))
    expect(Math.abs((sw.top + sw.bottom) / 2 - (swLabel.top + swLabel.bottom) / 2), "switch stays on the label's line").toBeLessThan(6)
    const segmented = await box(page.locator("#approval-mode"))
    expect(segmented.width, "segmented control fills the row").toBeCloseTo((await box(row(page, "Approval notices"))).width - 32, 0)

    // Lists: the state moves under the title; the role select goes full width under the name.
    const jobs = page.getByRole("list", { name: "Automations" }).locator(":scope > li")
    const title = await box(jobs.first().getByRole("link"))
    const state = await box(jobs.first().getByText("Active", { exact: true }))
    expect(state.top, "state under the title").toBeGreaterThan(title.bottom)
    const brief = jobs.nth(2)
    expect((await box(brief.getByRole("alert"))).top, "the failure reason follows its state").toBeGreaterThan((await box(brief.getByText("Couldn't start", { exact: true }))).bottom)
    const jonas = page.getByRole("list", { name: "Members" }).locator(":scope > li").nth(1)
    const nameLine = await box(jonas.getByText("Jonas Weber"))
    const role = jonas.getByRole("combobox", { name: "Role for Jonas Weber" })
    const roleBox = await box(role)
    expect(roleBox.top, "role select under the name").toBeGreaterThan(nameLine.bottom)
    expect(roleBox.left, "role select starts at the name").toBeCloseTo(nameLine.left, 0)
    const memberCard = await box(page.getByRole("region", { name: "Members" }))
    expect(roleBox.right, "role select runs to the card's inset").toBeCloseTo(memberCard.right - 17, 0)
    const value = role.locator(":scope > span").first()
    expect(await value.evaluate((node) => node.scrollWidth <= node.clientWidth), "the role name is not cut off").toBe(true)
    const email = await box(page.getByText("ana.lima.growth-operations-team@fieldnote-analytics.example"))
    expect(email.right, "a long address wraps inside the card").toBeLessThanOrEqual(PHONE.width - 16)

    // The ⋯ menu as a phone sees it.
    await page.getByRole("list", { name: "Automations" }).locator(":scope > li").first().getByRole("button", { name: /More actions/ }).click()
    await expect(page.getByRole("menu")).toBeVisible()
    await shot(page, testInfo, `menu-390-${theme}.png`)
    await page.keyboard.press("Escape")

    expect(await smallText(page), "no visible text under 14px").toEqual([])
    expect(await pageOverflow(page), "no sideways page scroll").toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
  })

  test(`sections that load after the page: the strip centres the current tab when it arrives (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-settings--sections-load-later", theme, PHONE)
    const nav = page.getByRole("navigation", { name: "Settings sections" })
    const current = nav.locator('a[aria-current="page"]')
    await expect(current).toHaveText(/Team/)
    await expect.poll(async () => {
      const [tab, strip] = [await box(current), await box(nav)]
      return tab.left >= strip.left + 16 && tab.right <= strip.right - 16
    }, { message: "the current tab came into view" }).toBe(true)
    expect(await nav.evaluate((node) => node.scrollLeft), "the strip scrolled to it").toBeGreaterThan(0)
    expect(await page.evaluate(() => [window.scrollX, window.scrollY]), "only the strip scrolled, never the page").toEqual([0, 0])
    await shot(page, testInfo, `sections-load-later-390-${theme}.png`)
    expect(errors).toEqual([])
  })

  test(`settings page without navigation: the 48rem column alone (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-settings--without-navigation", theme, DESKTOP)
    await expect(page.getByRole("navigation")).toHaveCount(0)
    const article = await box(page.locator(".tangle-reading-article"))
    const header = await box(page.locator(".tangle-reading-header"))
    expect(article.width, "the article keeps its 48rem column").toBeCloseTo(768, 0)
    expect(header.left, "the header starts with the column").toBeCloseTo(article.left, 0)
    expect(header.right, "the header ends with the column").toBeCloseTo(article.right, 0)
    expect(article.left, "the column is centred").toBeCloseTo(DESKTOP.width - article.right, 0)
    await shot(page, testInfo, `without-navigation-1280-${theme}.png`, { fullPage: true })
    await page.setViewportSize(PHONE)
    expect((await box(page.locator(".tangle-reading-article"))).width, "the column spans the phone inside its gutters").toBeCloseTo(PHONE.width - 32, 0)
    expect(await pageOverflow(page), "no sideways page scroll").toBeLessThanOrEqual(1)
    await shot(page, testInfo, `without-navigation-390-${theme}.png`, { fullPage: true })
    expect(errors).toEqual([])
  })

  test(`a frame bounded by className picks its layout from its own width (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-settings--bounded", theme, DESKTOP)
    const frame = await box(page.locator(".tangle-settings-frame"))
    expect(frame.width, "max-w-2xl bounds the frame").toBe(672)
    expect(frame.left, "mx-auto centres it").toBeCloseTo((DESKTOP.width - 672) / 2, 0)
    const nav = page.getByRole("navigation", { name: "Settings sections" })
    expect((await box(nav)).height, "a 42rem frame gets the tab strip in a 1280 px window").toBe(56)
    const article = await box(page.locator(".tangle-reading-article"))
    expect(article.width, "the article spans the frame inside its gutters").toBeCloseTo(672 - 48, 0)
    await shot(page, testInfo, `bounded-1280-${theme}.png`, { fullPage: true })
    expect(errors).toEqual([])
  })

  test(`fields at 1280 and 390 px (${theme})`, async ({ page }, testInfo) => {
    const errors = await openStory(page, "primitives-settings--fields", theme, DESKTOP)
    const error = page.locator(`#default-model-message`)
    await expect(error).toHaveAttribute("role", "alert")
    await expect(error).toContainText("refuses Anthropic models")
    await expect(page.getByText("Display name")).toHaveAttribute("for", "display-name")
    await expect(page.getByRole("button", { name: "About Default model" })).toBeVisible()
    expect(await smallText(page), "no visible text under 14px").toEqual([])
    await shot(page, testInfo, `fields-1280-${theme}.png`, { fullPage: true })
    await page.setViewportSize(PHONE)
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1)
    await shot(page, testInfo, `fields-390-${theme}.png`, { fullPage: true })
    expect(errors).toEqual([])
  })
}

test("settings page in an 820 px pane: tab strip with side-by-side rows", async ({ page }, testInfo) => {
  const errors = await openStory(page, "primitives-settings--page", "light", SPLIT)
  const nav = page.getByRole("navigation", { name: "Settings sections" })
  expect((await box(nav)).height, "below 60rem the nav is the strip").toBe(56)
  const name = row(page, "Project name")
  expect((await box(page.locator("#project-name"))).left, "rows stay side by side above 34rem").toBeGreaterThan((await box(name.locator("label"))).right)
  await shot(page, testInfo, "page-820-light.png", { fullPage: true })
  expect(errors).toEqual([])
})

test("the info tip and the switch keep their size and a 44px touch target", async ({ browser }) => {
  const context = await browser.newContext({ viewport: PHONE, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = await openStory(page, "primitives-settings--page", "light", PHONE)
  const tip = row(page, "Timezone").getByRole("button", { name: "About Timezone" })
  const glyph = await box(tip)
  expect(glyph.width, "the visible glyph stays 20px").toBe(20)
  const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label"), { x: glyph.left - 10, y: glyph.top + glyph.height / 2 })
  expect(hit, "a tap 10px outside the glyph still lands on it").toBe("About Timezone")
  await tip.tap()
  await expect(page.getByRole("tooltip")).toContainText("Dates in chats")
  await tip.tap()
  await expect(page.getByRole("tooltip")).toHaveCount(0)

  const digest = page.locator("#digest")
  await digest.scrollIntoViewIfNeeded()
  const track = await box(digest)
  expect([track.width, track.height], "the visible track stays 36 x 20").toEqual([36, 20])
  const centre = track.left + track.width / 2
  const hitAt = (x, y) => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.id, { x, y })
  expect(await hitAt(centre, track.top - 10), "10px above the track").toBe("digest")
  expect(await hitAt(centre, track.bottom + 10), "10px below the track").toBe("digest")
  expect(await hitAt(track.left - 3, track.top + 10), "3px left of the track").toBe("digest")
  expect(await hitAt(centre, track.top - 15), "the area ends at 44px").not.toBe("digest")
  await expect(digest).toHaveAttribute("aria-checked", "true")
  await page.touchscreen.tap(centre, track.bottom + 10)
  await expect(digest, "a tap under the track toggles it").toHaveAttribute("aria-checked", "false")
  expect(errors).toEqual([])
  await context.close()
})
