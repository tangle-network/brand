import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { Hono } from 'hono';
import { html } from 'hono/html';
import { pageMetadata } from '@tangle-network/brand/social';

const page = {
  url: 'https://product.tangle.tools/?source=share#preview',
  title: 'Tangle Product',
  description: 'Run an agent task.',
  image: {
    url: 'https://product.tangle.tools/og-tangle-v1.png',
    type: 'image/png', width: 1200, height: 630,
    alt: 'Tangle logo beside an indigo knot',
  },
};
const routeTitle = 'Route "<script>& title';
const routeDescription = 'A description with "quotes" & <markup>.';
const app = new Hono();
app.get('*', (c) => {
  try {
    const descriptors = pageMetadata(page, {
      pathname: c.req.path === '/origin' ? '//external.invalid/path' : c.req.path,
      overrides: c.req.path === '/partial'
        ? [{ [c.req.query('attribute') ?? 'property']: c.req.query('key') ?? 'og:image', content: 'https://external.invalid/cover.jpg' }]
        : c.req.path === '/empty' ? [
            { title: '   ' }, { name: 'description', content: '' },
            { name: 'robots', content: 'noindex' },
          ] : [
            { title: 'Replaced title' }, { title: routeTitle },
            { name: 'description', content: routeDescription },
            { tagName: 'link', rel: 'canonical', href: 'https://external.invalid/' },
            { name: 'robots', content: 'noindex' },
          ],
    });
    return c.html(html`<!doctype html><head>${descriptors.map(tag => {
      if ('title' in tag) return html`<title>${tag.title}</title>`;
      if ('tagName' in tag) return html`<link rel="${tag.rel}" href="${tag.href}">`;
      if ('property' in tag) return html`<meta property="${tag.property}" content="${tag.content}">`;
      return html`<meta name="${tag.name}" content="${tag.content}">`;
    })}</head>`);
  } catch (error) {
    return c.json({ error: error.message }, 422);
  }
});
const server = createServer(async (request, response) => {
  const result = await app.request(`http://localhost${request.url}`, {
    headers: request.headers,
  });
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(Buffer.from(await result.arrayBuffer()));
}).listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const path of ['/article?source=telegram', '/origin', '/empty']) {
    const response = await fetch(`${base}${path}`, { headers: { 'User-Agent': 'TelegramBot (like TwitterBot)' } });
    assert.equal(response.status, 200);
    const body = await response.text();
    const tags = body.match(/<meta\b[^>]*>/g) ?? [];
    const value = key => {
      const matching = tags.filter(tag => tag.includes(`name="${key}"`) || tag.includes(`property="${key}"`));
      assert.equal(matching.length, 1, `Exactly one ${key}`);
      return /content="([^"]*)"/.exec(matching[0])[1];
    };
    const escapedTitle = String(await html`${path === '/empty' ? page.title : routeTitle}`);
    assert.equal(/<title>(.*?)<\/title>/.exec(body)[1], escapedTitle);
    assert.equal(value('og:title'), escapedTitle);
    assert.equal(value('twitter:title'), escapedTitle);
    assert.equal(value('description'), value('og:description'));
    assert.equal(value('description'), value('twitter:description'));
    if (path === '/empty') assert.equal(value('description'), page.description);
    assert.equal(value('robots'), 'noindex');
    assert.equal(value('og:image'), page.image.url);
    assert.equal(value('og:image:secure_url'), page.image.url);
    assert.equal(value('twitter:image'), page.image.url);
    assert.equal(value('og:image:width'), '1200');
    assert.equal(value('og:image:height'), '630');
    assert.equal(value('og:image:type'), 'image/png');
    const canonical = `https://product.tangle.tools${path === '/origin' ? '//external.invalid/path' : path.split('?')[0]}`;
    assert.equal(value('og:url'), canonical);
    assert(body.includes(`<link rel="canonical" href="${canonical}">`));
    assert(!body.includes('<script>'));
    console.log(JSON.stringify({ path, outcome: 'PASS', canonical, title: value('og:title') }));
  }
  for (const path of ['/partial', '/partial?attribute=name&key=og:image', '/partial?attribute=property&key=twitter:image']) {
    const rejected = await fetch(`${base}${path}`);
    assert.equal(rejected.status, 422);
    assert.match((await rejected.json()).error, /partial route overrides/);
    console.log(`PASS partial social override rejected through mounted HTTP renderer: ${path}`);
  }
} finally {
  server.close();
  server.closeAllConnections();
}
