/**
 * Prune heavy packages from .next/standalone after Next.js build.
 *
 * The Netlify plugin copies .next/standalone into the handler zip. If that
 * directory is too large the deploy OOMs or exceeds Lambda's 250 MB limit.
 * This script removes packages that are build-time only, browser-only, or
 * handled by separate Netlify functions — before the plugin runs.
 *
 * Runs as `postbuild` in package.json, after `next build`, before the
 * Netlify plugin's onBuild hook packages the handler.
 */

import { rm, readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const STANDALONE_DIR = resolve('.next/standalone');

const PRUNE_PACKAGES = [
  '@next/swc-linux-x64-gnu', '@next/swc-linux-x64-musl',
  '@next/swc-darwin-x64', '@next/swc-darwin-arm64', '@next/swc-win32-x64-msvc',
  '@esbuild', 'webpack', 'webpack-sources', '@swc',
  'googleapis', 'google-auth-library',
  'tesseract.js', 'tesseract.js-core',
  'sharp', '@img', '@napi-rs',
  'canvas',
  'pdf-lib', 'pdf-parse', 'pdfkit', 'pdfjs-dist', 'jspdf', '@react-pdf',
  '@ffmpeg-installer', '@ffprobe-installer', 'fluent-ffmpeg',
  'puppeteer', 'puppeteer-core', 'playwright', 'playwright-core',
  'chromium-bidi', '@playwright', '@sparticuz', 'chrome-aws-lambda',
  'monaco-editor', 'node-pty',
  'video.js', 'hls.js',
  '@mediapipe',
  'three', 'three-stdlib', '@react-three',
  'lucide-react',
  'recharts',
  'html2canvas',
  '@sentry/cli-linux-x64',
  'typescript', 'core-js', 'prettier', 'tailwindcss', 'autoprefixer',
  'postcss', 'eslint', '@typescript-eslint', 'vitest',
  'jsdom', 'happy-dom',
  'docx', 'mammoth',
  'yjs', 'y-protocols', 'lib0',
  '@webcontainer',
  '@mailchimp', 'csv-parse', 'sitemap', 'jszip',
  'fast-xml-parser', 'marked', 'cheerio',
];

async function pruneNodeModules(nodeModulesDir) {
  if (!existsSync(nodeModulesDir)) return 0;
  let removed = 0;
  for (const pkg of PRUNE_PACKAGES) {
    const pkgPath = join(nodeModulesDir, pkg);
    if (existsSync(pkgPath)) {
      await rm(pkgPath, { recursive: true, force: true });
      console.log(`  [prune] removed ${pkg}`);
      removed++;
    }
  }
  return removed;
}

async function prunePnpmStore(pnpmDir) {
  if (!existsSync(pnpmDir)) return 0;
  let removed = 0;
  const entries = await readdir(pnpmDir);
  for (const entry of entries) {
    const matches = PRUNE_PACKAGES.some(pkg => {
      const pnpmPkg = pkg.startsWith('@')
        ? pkg.replace('/', '+')
        : pkg;
      return entry.startsWith(pnpmPkg + '@') || entry === pnpmPkg;
    });
    if (matches) {
      await rm(join(pnpmDir, entry), { recursive: true, force: true });
      console.log(`  [prune] removed .pnpm/${entry}`);
      removed++;
    }
  }
  return removed;
}

async function main() {
  if (!existsSync(STANDALONE_DIR)) {
    console.log('[prune-standalone] .next/standalone not found — skipping');
    return;
  }
  console.log('[prune-standalone] pruning heavy packages from .next/standalone...');

  const topNM = join(STANDALONE_DIR, 'node_modules');
  const r1 = await pruneNodeModules(topNM);
  const r2 = await prunePnpmStore(join(topNM, '.pnpm'));

  // Also check monorepo-style nested path
  const entries = await readdir(STANDALONE_DIR);
  let rNested = 0;
  for (const entry of entries) {
    if (entry === 'node_modules') continue;
    const nested = join(STANDALONE_DIR, entry, 'node_modules');
    if (existsSync(nested)) {
      rNested += await pruneNodeModules(nested);
      rNested += await prunePnpmStore(join(nested, '.pnpm'));
    }
  }

  console.log(`[prune-standalone] done — removed ${r1 + r2 + rNested} entries`);
}

main().catch(err => {
  // Never fail the build — a large bundle is better than a broken deploy
  console.error('[prune-standalone] error:', err.message);
  process.exit(0);
});
