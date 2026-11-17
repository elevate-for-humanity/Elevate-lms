import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

// Only synthetic, read-only content is rendered. No hosting/customer DB is used.
const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = resolve(root, 'tests/fixtures/tenant-composition');
const temp = await mkdtemp(join(tmpdir(), 'tenant-composition-'));
const artifacts = resolve(root, 'test-results/tenant-composition');
let server, browser;
try {
  await writeFile(join(temp, 'input.css'), '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
  await writeFile(join(temp, 'tailwind.cjs'), `module.exports={content:[${JSON.stringify(root + 'components/**/*.tsx')}],theme:{extend:{}},plugins:[]}`);
  execFileSync(process.execPath, [resolve(root, 'node_modules/tailwindcss/lib/cli.js'), '-c', join(temp, 'tailwind.cjs'), '-i', join(temp, 'input.css'), '-o', join(temp, 'fixture.css'), '--minify'], { stdio: 'inherit' });
  server = await createServer({ configFile: false, root: fixture,
    resolve: { alias: { '@': root, 'next/navigation': join(fixture, 'navigation.ts'), 'fixture-styles': join(temp, 'fixture.css') } },
    css: { postcss: { plugins: [] } }, esbuild: { jsx: 'automatic' },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [root, temp] } } });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#678"/><circle cx="200" cy="160" r="80" fill="#efc"/></svg>';
  server.middlewares.use((req, res, next) => {
    if (['/graphic.svg', '/portrait.svg'].includes(req.url)) { res.setHeader('Content-Type', 'image/svg+xml'); res.end(svg); }
    else next();
  });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  // Fail closed on unintended remote requests, including any fixture navigation.
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  await mkdir(artifacts, { recursive: true });
  for (const legacy of [false, true]) for (const width of [320, 390, 768, 1280]) for (const position of ['full', 'left', 'right', 'off']) {
    await page.setViewportSize({ width, height: 900 });
    const url = new URL(base);
    if (legacy) url.searchParams.set('legacy', '1');
    url.searchParams.set(position === 'off' ? 'withoutBackdrop' : 'position', position);
    await page.goto(url.href, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'A customer headline' }).waitFor();
    const result = await page.evaluate(() => {
      const hero = document.querySelector('.tenant-hero');
      const backdrop = hero.querySelector('.tenant-hero-backdrop');
      const band = document.querySelector('.tenant-introduction-band');
      const portrait = document.querySelector('img[alt="Fixture portrait"]');
      const box = e => { const b = e.getBoundingClientRect(); return { x:b.x, y:b.y, right:b.right, bottom:b.bottom, width:b.width, height:b.height }; };
      return { viewport:innerWidth, scroll:document.documentElement.scrollWidth, hero:box(hero), band:box(band), portrait:{...box(portrait), loaded:portrait.complete && portrait.naturalWidth > 0},
        gridZ:getComputedStyle(hero.querySelector(':scope > div')).zIndex,
        backdrop:backdrop && {...box(backdrop), opacity:getComputedStyle(backdrop).opacity, pointerEvents:getComputedStyle(backdrop).pointerEvents, z:getComputedStyle(backdrop).zIndex, alt:backdrop.alt, hidden:backdrop.getAttribute('aria-hidden'), loaded:backdrop.complete && backdrop.naturalWidth > 0},
        audio:[...document.querySelectorAll('audio')].map(a=>({src:a.getAttribute('src'),paused:a.paused})), buttons:[...band.querySelectorAll('button')].map(b=>({...box(b),disabled:b.disabled})) };
    });
    assert.equal(result.scroll, width, 'horizontal overflow');
    assert.ok(result.band.bottom <= result.hero.y + 1, 'introduction precedes hero');
    assert.ok(result.portrait.loaded && result.portrait.width > 0 && result.portrait.height > 0, 'foreground portrait remains visible');
    if (position === 'off') assert.equal(result.backdrop, null);
    else {
      const b = result.backdrop;
      assert.ok(b.loaded); assert.equal(b.opacity, '0.12'); assert.equal(b.pointerEvents, 'none'); assert.equal(b.alt, ''); assert.equal(b.hidden, 'true');
      assert.ok(Number(result.gridZ) > Number(b.z), 'content paints above backdrop');
      assert.ok(Math.abs(b.width - result.hero.width * (position === 'full' ? 1 : .65)) < 2, 'backdrop width');
      assert.ok(Math.abs((position === 'left' ? b.x - result.hero.x : b.right - result.hero.right)) < 2, 'backdrop placement');
    }
    assert.equal(result.audio.length, 2);
    for (const a of result.audio) { assert.equal(a.src, null); assert.equal(a.paused, true); }
    for (const b of result.buttons) { assert.ok(b.disabled); assert.ok(b.height >= 44); assert.ok(b.x >= 0 && b.right <= width + 1); }
    assert.deepEqual(errors, [], 'browser runtime errors');
    if (position === 'right') await page.screenshot({ path: join(artifacts, `${legacy ? 'legacy' : 'generic'}-${width}.png`), fullPage: true });
    console.log(JSON.stringify({ legacy, width, position, passed:true }));
  }
} finally {
  await browser?.close();
  await server?.close();
  await rm(temp, { recursive:true, force:true });
}
