import { createRequire } from 'node:module';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Real shared component and decoded repository media; this source fixture is
// deliberately separate from deployed, authenticated learner acceptance.
const root = process.cwd();
const require = createRequire(join(root, 'package.json'));
const esbuild = createRequire(require.resolve('vite/package.json'))('esbuild');
const { chromium, webkit, devices, expect } = require('@playwright/test');
const project =
  process.argv.find((arg) => arg.startsWith('--project='))?.split('=')[1] || 'desktop-chrome';
const profiles = {
  'desktop-chrome': { engine: chromium, options: { viewport: { width: 1440, height: 900 } } },
  'laptop-chrome': { engine: chromium, options: { viewport: { width: 1280, height: 720 } } },
  'tablet-chrome': {
    engine: chromium,
    options: { ...devices['iPad Pro 11'], browserName: undefined },
  },
  'iphone-webkit': { engine: webkit, options: { ...devices['iPhone 13'], browserName: undefined } },
  'android-chrome': {
    engine: chromium,
    options: { ...devices['Pixel 7'], browserName: undefined },
  },
};
assert(profiles[project], 'Use a named repository device profile');
const temp = await mkdtemp(join(tmpdir(), 'elevate-lesson-player-'));
const evidence = resolve('artifacts/lesson-player-pause-resume', project);
await mkdir(evidence, { recursive: true });
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import LessonPlayer from './components/lms/LessonPlayer';
import InteractiveVideoPlayer from './components/lms/InteractiveVideoPlayer';
const interactive = new URLSearchParams(location.search).get('player') === 'interactive';
createRoot(document.getElementById('root')).render(
  <main className="mx-auto w-full max-w-5xl p-4">
    {interactive
      ? <InteractiveVideoPlayer videoUrl="/lesson.mp4" title="HVAC pause and resume verification" readOnly />
      : <LessonPlayer videoUrl="/lesson.mp4" lessonTitle="HVAC pause and resume verification" />}
  </main>
);`;
let server;
let browser;
try {
  // Preview mode must never contact or modify learner records. Fail loudly
  // if the real component accidentally calls its database client in this fixture.
  await writeFile(
    join(temp, 'no-database.ts'),
    'export function createClient() { throw new Error("Read-only media fixture attempted database access"); }',
  );
  await esbuild.build({
    stdin: { contents: fixture, resolveDir: root, sourcefile: 'player-fixture.tsx', loader: 'tsx' },
    bundle: true,
    outfile: join(temp, 'fixture.js'),
    jsx: 'automatic',
    alias: { '@/lib/supabase/client': join(temp, 'no-database.ts'), '@': root },
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  });
  await writeFile(
    join(temp, 'input.css'),
    '@tailwind base;@tailwind components;@tailwind utilities;',
  );
  await writeFile(join(temp, 'fixture-source.tsx'), fixture);
  execFileSync(
    process.execPath,
    [
      require.resolve('tailwindcss/lib/cli.js'),
      '-i',
      join(temp, 'input.css'),
      '-o',
      join(temp, 'tailwind.css'),
      '--content',
      [
        join(temp, 'fixture-source.tsx'),
        join(root, 'components/lms/LessonPlayer.tsx'),
        join(root, 'components/lms/InteractiveVideoPlayer.tsx'),
      ].join(','),
    ],
    { cwd: root, stdio: 'inherit' },
  );
  await writeFile(
    join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>Lesson player source verification</title>
    <link rel="stylesheet" href="/tailwind.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`,
  );
  if (process.argv.includes('--build-only')) {
    console.log('Shared LessonPlayer and touch-control styles compiled successfully.');
  } else {
    const film = await readFile(join(root, 'public/videos/hvac-recruitment-20261029.mp4'));
    server = createServer(async (req, res) => {
      const path = new URL(req.url || '/', 'http://localhost').pathname;
      if (path === '/lesson.mp4') {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
        if (range) {
          const start = Number(range[1]);
          const end = Math.min(range[2] ? Number(range[2]) : film.length - 1, film.length - 1);
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${film.length}`,
            'Content-Length': end - start + 1,
          });
          res.end(film.subarray(start, end + 1));
        } else {
          res.setHeader('Content-Length', film.length);
          res.end(film);
        }
        return;
      }
      const file = {
        '/': 'index.html',
        '/fixture.js': 'fixture.js',
        '/tailwind.css': 'tailwind.css',
      }[path];
      if (!file) {
        res.writeHead(404).end();
        return;
      }
      res.setHeader(
        'Content-Type',
        file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html',
      );
      res.end(await readFile(join(temp, file)));
    });
    await new Promise((ok, fail) => {
      server.once('error', fail);
      server.listen(0, '127.0.0.1', ok);
    });
    browser = await profiles[project].engine.launch();
    for (const player of ['lesson', 'interactive']) {
      const page = await browser.newPage(profiles[project].options);
      const labels =
        player === 'interactive'
          ? { start: 'Play lesson video', play: 'Play lesson video', pause: 'Pause lesson video' }
          : { start: 'Play video', play: 'Play', pause: 'Pause' };
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/?player=${player}`);
      const video = page.locator('video').first();
      await page.getByRole('button', { name: labels.start, exact: true }).click();
      await expect
        .poll(() => video.evaluate((v) => v.currentTime), { timeout: 20_000 })
        .toBeGreaterThan(0.5);
      const cycles = [];
      for (let cycle = 0; cycle < 2; cycle++) {
        const pause = page.getByRole('button', { name: labels.pause, exact: true });
        const touch = await page.evaluate(() => matchMedia('(hover: none)').matches);
        if (touch) await page.waitForTimeout(3_500);
        else await video.hover();
        const controls = await pause.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return {
            width: rect.width,
            height: rect.height,
            color: getComputedStyle(button).color,
            opacity: getComputedStyle(button.parentElement.parentElement.parentElement).opacity,
            reachable: hit === button || button.contains(hit),
          };
        });
        assert(
          controls.width >= 44 && controls.height >= 44 && controls.reachable,
          JSON.stringify(controls),
        );
        assert.equal(controls.color, 'rgb(255, 255, 255)');
        assert.equal(controls.opacity, '1');
        await pause.click();
        await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
        const pausedAt = await video.evaluate((v) => v.currentTime);
        await page.waitForTimeout(1_000);
        const heldAt = await video.evaluate((v) => v.currentTime);
        assert(Math.abs(heldAt - pausedAt) < 0.1, 'Pausing must freeze the actual decoded media');
        await page.screenshot({ path: join(evidence, `${player}-paused-${cycle}.png`) });
        await page.getByRole('button', { name: labels.play, exact: true }).click();
        const resumedAt = await video.evaluate((v) => v.currentTime);
        assert(resumedAt >= pausedAt - 0.1, 'Resume must not reset the film');
        await expect
          .poll(() => video.evaluate((v) => v.currentTime), { timeout: 20_000 })
          .toBeGreaterThan(pausedAt + 0.5);
        cycles.push({ pausedAt, heldAt, resumedAt, controls });
      }
      const layout = await video.evaluate((v) => ({
        inline: v.playsInline,
        fit: getComputedStyle(v).objectFit,
        width: v.getBoundingClientRect().width,
        viewport: innerWidth,
        overflow: document.documentElement.scrollWidth - innerWidth,
        decodedWidth: v.videoWidth,
        decodedHeight: v.videoHeight,
        error: v.error?.code ?? 0,
      }));
      assert(
        layout.inline &&
          layout.fit === 'contain' &&
          layout.decodedWidth > 0 &&
          layout.decodedHeight > 0,
      );
      assert(
        layout.width <= layout.viewport && layout.overflow <= 1 && layout.error === 0,
        JSON.stringify(layout),
      );
      assert.deepEqual(errors, []);
      await page.screenshot({ path: join(evidence, `${player}-resumed.png`) });
      await writeFile(
        join(evidence, `${player}-results.json`),
        JSON.stringify(
          {
            sourceSha: process.env.GITHUB_SHA || null,
            project,
            checkedAt: new Date().toISOString(),
            fixtureOnly: true,
            authenticatedLearnerVerified: false,
            cycles,
            layout,
            errors,
          },
          null,
          2,
        ),
      );
      console.log(JSON.stringify({ project, player, cycles, layout }));
      await page.close();
    }
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((ok) => server.close(ok));
  await rm(temp, { recursive: true, force: true });
}
