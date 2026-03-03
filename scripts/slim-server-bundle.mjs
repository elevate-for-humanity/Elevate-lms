/**
 * Post-build: remove heavy packages from node_modules so the
 * Netlify server handler stays under the 250 MB zip limit.
 */

import { rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const REMOVE = [
  'googleapis',          // 194 MB — never imported, only raw fetch
  'monaco-editor',       // 75 MB — browser-only
  'node-pty',            // 63 MB — browser-only
  'video.js',            // 19 MB — browser-only
  'pdfjs-dist',          // 28 MB — browser-only
  'playwright',
  'playwright-core',
  'puppeteer',
  'puppeteer-core',
  'chromium-bidi',
  'happy-dom',
  'jsdom',
  'prettier',
  'typescript',
  '@sentry/cli-linux-x64',
  '@napi-rs/canvas-linux-x64-gnu',
  '@img/sharp-libvips-linux-x64',
];

const pnpmDir = 'node_modules/.pnpm';
let removed = 0;

if (existsSync(pnpmDir)) {
  const entries = await readdir(pnpmDir);
  for (const pkg of REMOVE) {
    const prefix = pkg.replace(/\//g, '+') + '@';
    for (const entry of entries) {
      if (entry.startsWith(prefix)) {
        await rm(join(pnpmDir, entry), { recursive: true, force: true });
        console.log(`  rm ${entry}`);
        removed++;
      }
    }
    // Remove top-level symlink
    const top = join('node_modules', pkg);
    if (existsSync(top)) {
      await rm(top, { recursive: true, force: true });
    }
  }
}

console.log(`Removed ${removed} package dirs`);
