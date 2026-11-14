/**
 * Prune heavy packages from node_modules/.pnpm after next build.
 *
 * The Netlify plugin copies .next/standalone which contains symlinks into
 * node_modules/.pnpm/. When Netlify zips the handler it resolves those
 * symlinks, pulling in the full package content. This script deletes the
 * heavy packages from .pnpm so the zip stays under 250 MB.
 *
 * Runs after `next build` in the Netlify build command, before the plugin
 * copies the standalone directory.
 *
 * IMPORTANT: This only runs on Netlify (CI=true). Never runs locally.
 */

import { rm, readdir, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

if (!process.env.CI) {
  console.log('[prune-node-modules] not on CI — skipping');
  process.exit(0);
}

const PNPM_DIR = resolve('node_modules/.pnpm');

const PRUNE_PACKAGES = [
  // Next.js SWC compiler binaries (113 MB each)
  '@next+swc-linux-x64-gnu',
  '@next+swc-linux-x64-musl',
  '@next+swc-darwin-x64',
  '@next+swc-darwin-arm64',
  '@next+swc-win32-x64-msvc',
  // esbuild binary
  '@esbuild',
  'esbuild',
  // webpack
  'webpack',
  'webpack-sources',
  // Google APIs (194 MB)
  'googleapis',
  'google-auth-library',
  // OCR (44 MB wasm)
  'tesseract.js',
  'tesseract.js-core',
  // Sharp / image
  'sharp',
  '@img',
  '@napi-rs',
  // Canvas
  'canvas',
  // PDF
  'pdf-lib',
  'pdf-parse',
  'pdfjs-dist',
  'jspdf',
  '@react-pdf',
  // Remotion — native binaries, Railway-only (~80MB)
  'remotion',
  '@remotion',
  // TTS + FFmpeg — Railway-only
  'edge-tts',
  'ffmpeg-static',
  '@ffmpeg',
  // FFmpeg
  '@ffmpeg-installer',
  '@ffprobe-installer',
  'fluent-ffmpeg',
  // Browser automation
  'puppeteer',
  'puppeteer-core',
  'playwright',
  'playwright-core',
  'chromium-bidi',
  '@playwright',
  '@sparticuz',
  // Editor / terminal
  'monaco-editor',
  'node-pty',
  // Video / media
  'video.js',
  'hls.js',
  // MediaPipe
  '@mediapipe',
  // 3D
  'three',
  'three-stdlib',
  '@react-three',
  // Icons (42 MB)
  'lucide-react',
  // Charting
  'recharts',
  // Screenshot
  'html2canvas',
  // Sentry CLI
  '@sentry+cli-linux-x64',
  '@sentry/cli',
  // Build / dev tools
  'typescript',
  'prettier',
  'tailwindcss',
  'autoprefixer',
  'eslint',
  '@typescript-eslint',
  'vitest',
  // DOM / test
  'jsdom',
  'happy-dom',
  // Document generation
  'docx',
  'mammoth',
  // Collaborative editing
  'yjs',
  'y-protocols',
  'lib0',
  // WebContainer
  '@webcontainer',
  // Misc
  '@mailchimp',
  'jszip',
  'marked',
  'cheerio',
  // node-pty — terminal emulator
  'node-pty',
  // 3D / physics (browser-only)
  'three',
  'three-stdlib',
  '@react-three',
  '@dimforge',
  // PDF (client-side generators)
  'jspdf',
  'pdfjs-dist',
  'pdfkit',
  'fontkit',
  'hyphen',
  // Video / media (browser-only)
  'hls.js',
  'hls',
  'video.js',
  '@videojs',
  'mediabunny',
  // Native canvas binding
  'canvas',
  '@napi-rs',
  // ML vision (browser/native only)
  '@mediapipe',
  // PDF text extractor
  'pdf-parse',
  // Utility lib (tree-shaken at build)
  'es-toolkit',
  // Polyfill not needed in modern Node
  'web-streams-polyfill',
  // SWC compiler (build-time only)
  '@swc/core',
  '@swc+core',
  // rspack — Turbopack/webpack build tool
  '@rspack',
  // core-js — polyfill, build-time only
  'core-js',
];

async function main() {
  if (!existsSync(PNPM_DIR)) {
    console.log('[prune-node-modules] node_modules/.pnpm not found — skipping');
    return;
  }

  console.log('[prune-node-modules] pruning heavy packages from node_modules/.pnpm...');
  const entries = await readdir(PNPM_DIR);
  let removed = 0;

  for (const entry of entries) {
    const matches = PRUNE_PACKAGES.some((pkg) => {
      // pnpm dir format: pkg@version or @scope+pkg@version
      // e.g. "hls.js@1.6" or "@swc+core-linux-x64-gnu@1.15" or "three@0.183"
      const bare = pkg.replace(/^@/, '').replace('/', '+'); // "@swc/core" → "swc+core"
      return (
        entry.startsWith(pkg + '@') ||
        entry === pkg ||
        entry.startsWith(bare + '@') ||
        entry.startsWith(bare + '-') || // platform suffix: swc+core-linux-x64-gnu@...
        entry.startsWith('@' + bare + '@') ||
        entry.startsWith('@' + bare + '-')
      ); // @swc+core-linux-x64-gnu@...
    });
    if (matches) {
      try {
        const pkgDir = join(PNPM_DIR, entry);
        const nodeModulesDir = join(pkgDir, 'node_modules');
        // Delete contents of the package dir but preserve the node_modules
        
        // can readdir it without throwing ENOENT.
        const pkgContents = await readdir(pkgDir);
        for (const item of pkgContents) {
          if (item !== 'node_modules') {
            await rm(join(pkgDir, item), { recursive: true, force: true });
          }
        }
        // Ensure node_modules dir exists (may not if package has no deps)
        await mkdir(nodeModulesDir, { recursive: true });
        console.log(`  removed .pnpm/${entry}`);
        removed++;
      } catch (err) {
        console.warn(`  failed to remove .pnpm/${entry}: ${err.message}`);
      }
    }
  }

  console.log(`[prune-node-modules] done — removed ${removed} entries`);
}

main().catch((err) => {
  console.error('[prune-node-modules] error:', err.message);
  process.exit(0); // never fail the build
});
