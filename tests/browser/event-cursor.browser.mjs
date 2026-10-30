/** The installed public hook reconnects a real native EventSource from sequence zero. */
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { build } from 'vite'
import { chromium } from 'playwright'

test('public named stream preserves zero cursor and retires its connection', { timeout: 30_000 }, async () => {
  const consumer = process.env.UI_HOOKS_CONSUMER
  assert.ok(consumer, 'Use the fresh installed public UI package')
  const scratch = await mkdtemp(resolve(consumer, '.cursor-host-')), entry = resolve(scratch, 'host.jsx')
  await writeFile(entry, `import React,{useCallback,useRef,useState}from'react';import{createRoot}from'react-dom/client';import{useEventStream}from'@tangle-network/ui/hooks';
function Host(){const cursor=useRef(-1),[rows,setRows]=useState([]),[open,setOpen]=useState(true);const url=useCallback(()=>'/stream?generation='+(cursor.current<0?'initial':'zero'),[]);useEventStream(open?url:undefined,{after:()=>cursor.current,events:{rows:event=>{const row=JSON.parse(event.data);cursor.current=row.seq;setRows(prior=>[...prior,row.seq])}}});return <><output>{JSON.stringify(rows)}</output><button onClick={()=>setOpen(false)}>Close</button></>}createRoot(document.getElementById('host')).render(<Host/>);`)
  const built = await build({ configFile: false, logLevel: 'silent', define: { 'process.env.NODE_ENV': JSON.stringify('production') }, build: { write: false, lib: { entry, formats: ['es'], fileName: () => 'host.js' }, rollupOptions: { output: { chunkFileNames: 'host/[name]-[hash].js' } } } })
  const chunks = new Map((Array.isArray(built) ? built : [built]).flatMap(result => result.output).map(item => [item.fileName, item.type === 'chunk' ? item.code : item.source]))
  const requests = [], generations = [], clients = new Set()
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname.startsWith('/assets/')) { res.setHeader('content-type', 'text/javascript'); return res.end(chunks.get(url.pathname.slice(8))) }
    if (url.pathname !== '/stream') return res.end('<!doctype html><div id="host"></div><script type="module" src="/assets/host.js"></script>')
    requests.push(url.searchParams.get('after')); generations.push(url.searchParams.get('generation'))
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
    clients.add(res); res.on('close', () => clients.delete(res))
    res.write(`event: rows\ndata: ${JSON.stringify({ seq: requests.length - 1 })}\n\n`)
    if (requests.length === 1) res.end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch({ headless: true }), page = await browser.newPage()
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`)
    await page.waitForFunction(() => document.querySelector('output')?.textContent === '[0,1]')
    assert.deepEqual(requests, [null, '0'], 'the first request has no cursor; reconnect starts after the actual zero row')
    assert.deepEqual(generations, ['initial', 'zero'], 'the same live connection resolves the actual generation only when reconnecting')
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await page.waitForTimeout(1200)
    assert.equal(clients.size, 0); assert.equal(requests.length, 2)
  } finally {
    for (const client of clients) client.end()
    await browser.close(); await new Promise(resolve => server.close(resolve)); await rm(scratch, { recursive: true, force: true })
  }
})
