import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { build } from 'vite'
import tailwindcss from '@tailwindcss/postcss'

/** Native packed-package proof; all observations are public DOM, URL and consumer outputs. */
export async function proveVirtualCommand(browser, { url, output, sourceSha, archiveSha256 }) {
  await mkdir(output, { recursive: true })
  const checks = []
  for (const width of [1512, 390]) for (const theme of ['light', 'dark']) {
    const dir = join(output, `${width}-${theme}`)
    await mkdir(dir, { recursive: true })
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce', recordVideo: { dir, size: { width, height: 900 } } })
    const page = await context.newPage(), errors = [], samples = []
    page.on('pageerror', error => errors.push(error.message))
    const input = page.getByRole('combobox', { name: 'Find recorded choice', exact: true })
    const list = page.getByRole('listbox', { name: 'Recorded choices', exact: true })
    const trigger = page.getByRole('button', { name: 'Choose recorded item', exact: true })
    const key = at => `choice:${String(at).padStart(4, '0')}`
    const committed = () => page.getByLabel('Committed choice', { exact: true }).innerText()
    const commits = async () => Number(await page.getByLabel('Choice commits', { exact: true }).innerText())
    const open = async expected => { await trigger.click(); await input.waitFor(); if (expected) await active(expected) }
    const escape = async () => {
      await input.press('Escape'); await input.waitFor({ state: 'hidden' })
      assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'Escape restores the trigger')
    }
    const active = async expected => {
      await page.waitForFunction(value => {
        const input = document.querySelector('input[role="combobox"]'), list = document.querySelector('[role="listbox"][aria-label="Recorded choices"]')
        const id = input?.getAttribute('aria-activedescendant'), row = id && document.getElementById(id)
        if (!row || list?.getAttribute('aria-activedescendant') !== id || row.dataset.commandValue !== value || row.getAttribute('aria-selected') !== 'true') return false
        const r = row.getBoundingClientRect(), box = list.getBoundingClientRect()
        return r.top >= box.top - 1 && r.bottom <= box.bottom + 1 && r.top >= 0 && r.bottom <= innerHeight
      }, expected)
      const measured = await list.evaluate(node => ({
        mounted: node.querySelectorAll('[role="option"]').length,
        headings: node.querySelectorAll('[data-command-group-heading]').length,
        groups: node.querySelectorAll('[role="group"]').length,
        selected: node.querySelectorAll('[role="option"][aria-selected="true"]').length,
      }))
      assert.ok(measured.mounted <= 40, 'Only the measured viewport and one active row are mounted')
      assert.ok(measured.headings <= 40 && measured.groups <= 40, 'Group DOM is windowed too')
      assert.equal(measured.selected, 1)
      samples.push({ expected, ...measured })
    }
    try {
      await page.goto(url)
      await page.evaluate(theme => { document.documentElement.className = theme; document.documentElement.dataset.theme = theme }, theme)
      const results = []
      for (const count of [1000, 122]) {
        await page.getByRole('button', { name: `Use ${count} choices`, exact: true }).click()
        const before = await commits(), last = key(count - 1)
        await open(last)
        await input.press('Home'); await active(key(0))
        const enabled = Array.from({ length: count }, (_, at) => at).filter(at => at !== 3)
        for (let at = 1; at <= 40; at++) { await input.press('ArrowDown'); await active(key(enabled[at])) }
        for (let at = 39; at >= 10; at--) { await input.press('ArrowUp'); await active(key(enabled[at])) }
        assert.equal(await commits(), before, 'Highlighting does not commit')
        // No intervening wait: the offscreen End target must mount before native Enter.
        await input.press('End'); await input.press('Enter'); await input.waitFor({ state: 'hidden' })
        assert.equal(await committed(), last)
        assert.equal(await commits(), before + 1)
        await open(last)
        await input.fill(last); await active(last)
        await input.fill(`Recorded choice ${String(count - 1).padStart(4, '0')}`); await active(last)
        await page.screenshot({ path: join(dir, `offscreen-search-${count}.png`) })
        assert.equal(await commits(), before + 1, 'Full-collection search is not a commit')
        await escape()
        await open(last); await input.fill('Twin label'); await active(key(7))
        const twin = list.locator(`[data-command-value="${key(8)}"]`)
        assert.equal(await list.getByRole('option', { name: 'Twin label', exact: true }).count(), 2)
        await twin.hover(); await active(key(8))
        assert.equal(await commits(), before + 1, 'Pointer highlight does not commit')
        await twin.click(); await input.waitFor({ state: 'hidden' })
        assert.equal(await committed(), key(8)); assert.equal(await commits(), before + 2)
        assert.equal(new URL(page.url()).searchParams.get('choice'), key(8))
        await open(key(8)); await input.fill('no-match-zqxv')
        await page.getByRole('status', { name: '', exact: true }).filter({ hasText: 'No results.' }).waitFor()
        assert.equal(await input.getAttribute('aria-activedescendant'), null)
        await input.press('Enter'); assert.equal(await commits(), before + 2)
        await input.fill(key(3))
        assert.equal(await list.getByRole('option').getAttribute('aria-disabled'), 'true')
        assert.equal(await input.getAttribute('aria-activedescendant'), null)
        await input.press('Enter'); assert.equal(await commits(), before + 2)
        await escape()
        await open(key(8)); await input.press('Home'); await active(key(0))
        await list.hover({ position: { x: 2, y: 2 } }); await page.mouse.wheel(0, 1400)
        await page.waitForFunction(() => document.querySelector('[role="listbox"][aria-label="Recorded choices"]').scrollTop > 300)
        await input.fill('Recorded'); await active(key(0))
        assert.equal(await committed(), key(8), 'Filtering preserves the committed route')
        await escape()
        results.push({ count, homeEnd: true, walk: [40, 30], immediateEndEnter: true, offscreenSearch: true, duplicates: true, emptyAndDisabledNoCommit: true, searchReset: true })
      }
      await page.getByRole('button', { name: 'Use 1000 groups', exact: true }).click()
      await open(key(999)); await input.press('Home'); await active(key(0))
      await input.press('End'); await active(key(999))
      assert.ok((await list.ariaSnapshot()).includes('Group 999'), 'The mounted group retains its accessible name')
      await page.screenshot({ path: join(dir, 'many-groups.png') }); await escape()
      for (const action of ['Disable', 'Remove']) {
        await page.getByRole('button', { name: 'Use 1000 choices', exact: true }).click()
        await page.getByRole('button', { name: `${action} current after opening`, exact: true }).click()
        await open(key(999))
        await page.waitForFunction(label => document.querySelector(`[aria-label="${label}"]`).textContent === 'choice:0999', action === 'Disable' ? 'Disabled choice' : 'Removed choice')
        await active(key(0)); assert.equal(await committed(), key(999), 'A live collection update does not commit fallback highlight')
        await escape()
      }
      await page.getByRole('button', { name: 'Use 1000 choices', exact: true }).click()
      await open(key(999)); await input.fill(key(8)); await active(key(8)); await input.press('Enter')
      await input.waitFor({ state: 'hidden' })
      await page.reload(); await page.evaluate(theme => { document.documentElement.className = theme; document.documentElement.dataset.theme = theme }, theme)
      assert.equal(await committed(), key(8)); await open(key(8))
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      assert.deepEqual(errors, [])
      await page.screenshot({ path: join(dir, 'retained-route.png') }); await escape()
      checks.push({ width, theme, sourceSha, archiveSha256, results, manyGroups: 1000, liveRemovalAndDisable: true, retainedRoute: key(8), maximumMounted: Math.max(...samples.map(row => row.mounted)), maximumGroupDOM: Math.max(...samples.map(row => row.headings + row.groups)), samples, errors, result: 'PASS' })
    } catch (error) {
      await page.screenshot({ path: join(dir, 'failure.png') })
      await writeFile(join(dir, 'failure.json'), JSON.stringify({ error: String(error), errors, samples, body: await page.locator('body').innerText() }, null, 2))
      throw error
    } finally {
      await context.close()
      await writeFile(join(output, 'checks.json'), JSON.stringify(checks, null, 2))
    }
  }
  console.log('Packed VirtualCommand: 122/1000 choices, four states, bounded DOM/ARIA/navigation/commit/focus PASS')
  return checks
}

/** Build only installed UI/Brand exports with the documented consumer source scan. */
async function commandHost(consumer) {
  const scratch = await mkdtemp(join(consumer, '.virtual-command-'))
  await writeFile(join(scratch, 'fixture.tsx'), await readFile(new URL('./virtual-command-fixture.tsx', import.meta.url)))
  await writeFile(join(scratch, 'main.tsx'), "import React from 'react';import{createRoot}from'react-dom/client';import{VirtualCommandConsumer}from'./fixture';import'./host.css';createRoot(document.getElementById('host')).render(<VirtualCommandConsumer/>);")
  await writeFile(join(scratch, 'host.css'), `
@import "tailwindcss" source(none);
@import "@tangle-network/brand/styles/tokens.css";
@import "@tangle-network/brand/styles/theme.css";
@import "@tangle-network/brand/styles/named-themes.css";
@import "@tangle-network/brand/styles/globals.css";
@source "../node_modules/@tangle-network/ui/src/**/*.tsx";
@source "../node_modules/@tangle-network/ui/src/**/*.ts";
`)
  const built = await build({ configFile: false, root: scratch, logLevel: 'warn', css: { postcss: { plugins: [tailwindcss()] } }, build: { write: false, lib: { entry: join(scratch, 'main.tsx'), formats: ['es'], fileName: () => 'host.js' } } })
  const chunks = new Map((Array.isArray(built) ? built : [built]).flatMap(result => result.output).map(item => [item.fileName, item.type === 'chunk' ? item.code : item.source]))
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname.startsWith('/assets/')) {
      response.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript')
      return response.end(chunks.get(url.pathname.slice(8)))
    }
    const css = [...chunks.keys()].filter(name => name.endsWith('.css')).map(name => `<link rel="stylesheet" href="/assets/${name}">`).join('')
    response.end(`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}<body><div id="host"></div><script type="module" src="/assets/host.js"></script></body></html>`)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return { url: `http://127.0.0.1:${server.address().port}`, close: async () => { await new Promise(resolve => server.close(resolve)); await rm(scratch, { recursive: true, force: true }) } }
}

test('packed VirtualCommand keeps full navigation and active descendants with bounded DOM', { timeout: 300_000 }, async () => {
  const consumer = process.env.UI_HOOKS_CONSUMER, output = process.env.UI_HOOKS_EVIDENCE
  assert.ok(consumer && output, 'Use a fresh installed UI package and retained native output')
  const { chromium } = await import('playwright')
  const host = await commandHost(consumer), browser = await chromium.launch({ headless: true })
  try { await proveVirtualCommand(browser, { url: host.url, output, sourceSha: process.env.UI_PROOF_SOURCE, archiveSha256: process.env.UI_PROOF_SHA256 }) }
  finally { await browser.close(); await host.close() }
})
