// Dev-only: renders the app icons (PNG) with the game's own drawing code.
// Run: node tools/make-icons.mjs   (needs Playwright with Chromium installed or available globally)
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'straw-hat-showdown', 'icons');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return import(join(globalRoot, 'playwright', 'index.mjs'));
  }
}

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(root, path.endsWith('/') ? `${path}index.html` : path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/index.html`);
const icons = await page.evaluate(async () => {
  const { drawIcon } = await import('/straw-hat-showdown/src/render/icon.js');
  const make = (size, opts) => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    drawIcon(c, opts);
    return c.toDataURL('image/png').split(',')[1];
  };
  return {
    'apple-touch-icon.png': make(180, {}),
    'icon-192.png': make(192, {}),
    'icon-512.png': make(512, {}),
    'icon-maskable-512.png': make(512, { maskable: true }),
  };
});
for (const [name, b64] of Object.entries(icons)) {
  await writeFile(join(outDir, name), Buffer.from(b64, 'base64'));
  console.log('wrote', join('straw-hat-showdown/icons', name));
}
await browser.close();
server.close();
