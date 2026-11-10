import { createRequire } from 'node:module';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = process.cwd();
const require = createRequire(join(root, 'package.json'));
const esbuild = createRequire(require.resolve('vite/package.json'))('esbuild');
const { chromium } = require('playwright');
const temp = await mkdtemp(join(tmpdir(), 'elevate-learning-layout-'));
const evidence = resolve('artifacts/learning-workspace');
await mkdir(evidence, { recursive: true });
const fixture = `
import React, {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import LearningWorkspace from './components/lms/LearningWorkspace';
import LessonFocusShell from './components/lms/LessonFocusShell';
function Video() {
  useEffect(() => { document.body.dataset.videoMounts = String(Number(document.body.dataset.videoMounts || 0) + 1); }, []);
  return <video aria-label="Lesson film" className="aspect-video w-full" controls />;
}
createRoot(document.getElementById('root')).render(
  <div className="test-frame">
    <LessonFocusShell header={<h1>HVAC layout verification fixture</h1>}>
      <div className="w-full min-w-0 px-4 py-8 sm:px-6">
        <LearningWorkspace initialView="preview" instructionLabel="Workbook & activities" previewLabel="Theory & video"
          instructions={<><label>Practice response<textarea aria-label="Practice response" className="w-full border" /></label>
            <LearningWorkspace instructionLabel="Chapter answers" previewLabel="Chapter diagram"
              instructions={<p>Workbook chapter</p>} preview={<p>Workbook diagram</p>} />
          </>}
          preview={<><Video /><p>The complete theory panel</p></>} />
      </div>
    </LessonFocusShell>
  </div>
);`;
let server;
let browser;
try {
  await esbuild.build({
    stdin: { contents: fixture, resolveDir: root, sourcefile: 'learning-layout-fixture.tsx', loader: 'tsx' },
    bundle: true, outfile: join(temp, 'fixture.js'), jsx: 'automatic',
    loader: { '.css': 'local-css' }, define: { 'process.env.NODE_ENV': '"production"' },
  });
  await writeFile(join(temp, 'input.css'), '@tailwind base;@tailwind components;@tailwind utilities;');
  await writeFile(join(temp, 'fixture-source.tsx'), fixture);
  execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', join(temp, 'input.css'),
    '-o', join(temp, 'tailwind.css'), '--content', [join(temp, 'fixture-source.tsx'),
      join(root, 'components/lms/LearningWorkspace.tsx'), join(root, 'components/lms/LessonFocusShell.tsx')].join(',')],
  { cwd: root, stdio: 'inherit' });
  await writeFile(join(temp, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="UTF-8">
    <title>Learning workspace layout verification</title><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="tailwind.css"><link rel="stylesheet" href="fixture.css">
    <style>@media(min-width:1024px){.test-frame{margin-left:240px}}video,textarea{max-width:100%}</style>
    </head><body><div id="root"></div><script src="fixture.js"></script></body></html>`);
  if (process.argv.includes('--build-only')) {
    console.log('Actual workspace/focus components and their styles compiled successfully.');
  } else {
    server = createServer(async (req, res) => {
      const path = new URL(req.url || '/', 'http://localhost').pathname;
      const file = { '/': 'index.html', '/fixture.js': 'fixture.js', '/fixture.css': 'fixture.css', '/tailwind.css': 'tailwind.css' }[path];
      if (!file) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(await readFile(join(temp, file)));
    });
    await new Promise((resolveServer, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveServer); });
    browser = await chromium.launch();
    const page = await browser.newPage();
    const results = [];
    for (const [width, height] of [[2560,1440], [1366,768], [1024,768], [768,1024], [390,844]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const workspace = page.locator('[data-learning-workspace]').first();
      const controls = workspace.locator(':scope > [role="group"]');
      await controls.getByRole('button', { name: 'Theory & video', exact: true }).waitFor();
      assert.equal(await workspace.getAttribute('data-view'), 'preview');
      const bounds = await workspace.evaluate(el => ({
        workspace: el.getBoundingClientRect().width,
        preview: el.querySelector(':scope > div:last-child > section:last-child').getBoundingClientRect().width,
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      assert(bounds.preview >= bounds.workspace - 2, JSON.stringify(bounds));
      assert(bounds.scroll <= width + 2, JSON.stringify(bounds));
      await page.screenshot({ path: join(evidence, `lesson-${width}.png`) });
      await controls.getByRole('button', { name: 'Workbook & activities', exact: true }).click();
      await page.getByRole('textbox', { name: 'Practice response' }).fill('Keep my workbook answers');
      const nested = workspace.locator('[data-learning-workspace]');
      await nested.getByRole('button', { name: 'Chapter diagram', exact: true }).click();
      await controls.getByRole('button', { name: 'Theory & video', exact: true }).click();
      await controls.getByRole('button', { name: 'Workbook & activities', exact: true }).click();
      assert.equal(await page.getByRole('textbox', { name: 'Practice response' }).inputValue(), 'Keep my workbook answers');
      assert.equal(await nested.getAttribute('data-view'), 'preview');
      await controls.getByRole('button', { name: 'Split view', exact: true }).click();
      assert.equal(await page.locator('body').getAttribute('data-video-mounts'), '1');
      await page.getByRole('button', { name: 'Enter focus mode' }).click();
      const focus = await page.locator('[data-focus-mode="active"]').boundingBox();
      assert(focus && Math.abs(focus.width - width) <= 1 && Math.abs(focus.x) <= 1, JSON.stringify(focus));
      assert.equal(await page.locator('body').evaluate(el => el.style.overflow), 'hidden');
      await page.screenshot({ path: join(evidence, `focus-${width}.png`) });
      await page.keyboard.press('Escape');
      await page.locator('[data-focus-mode="inactive"]').waitFor();
      assert.equal(await page.locator('body').evaluate(el => el.style.overflow), '');
      results.push({ width, height, expandedPanelWidth: bounds.preview, availableWorkspaceWidth: bounds.workspace,
        focusWidth: focus.width, answersRetained: true, videoMounts: 1, nestedViewRetained: true });
    }
    await writeFile(join(evidence, 'results.json'), JSON.stringify({
      sourceSha: process.env.GITHUB_SHA || null, fixtureOnly: true, authenticatedAccountSaveVerified: false, results,
    }, null, 2));
    console.log(JSON.stringify(results));
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolveServer => server.close(resolveServer));
  await rm(temp, { recursive: true, force: true });
}
