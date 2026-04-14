/**
 * Prune heavy packages from .next/standalone/node_modules after Next.js build.
 *
 * outputFileTracingExcludes should prevent these from being traced in, but pnpm's
 * symlink structure means some packages still end up in standalone. This script
 * removes them before the Netlify plugin packages the handler zip.
 *
 * Run via: postbuild script in package.json
 */

import { rm, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const STANDALONE_NODE_MODULES = resolve('.next/standalone/node_modules');

// Packages that must not be in the Lambda bundle.
// These are either build-time only, browser-only, or handled by separate Netlify functions.
const PRUNE_PACKAGES = [
  // Next.js build-time binaries
  '@next/swc-linux-x64-gnu',
  '@next/swc-linux-x64-musl',
  '@next/swc-darwin-x64',
  '@next/swc-darwin-arm64',
  '@next/swc-win32-x64-msvc',
  // esbuild
  '@esbuild',
  // webpack
  'webpack',
  'webpack-sources',
  // SWC
  '@swc',
  // Google APIs (194 MB)
  'googleapis',
  'google-auth-library',
  // OCR (44 MB wasm)
  'tesseract.js',
  'tesseract.js-core',
  // Sharp / image processing
  'sharp',
  '@img',
  '@napi-rs',
  // Canvas
  'canvas',
  // PDF
  'pdf-lib',
  'pdf-parse',
  'pdfkit',
  'pdfjs-dist',
  'jspdf',
  '@react-pdf',
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
  // Sentry CLI binary
  '@sentry/cli-linux-x64',
  // Build / dev tools
  'typescript',
  'core-js',
  'prettier',
  'tailwindcss',
  'autoprefixer',
  'postcss',
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
  'csv-parse',
  'sitemap',
  'jszip',
  'fast-xml-parser',
  'marked',
  'cheerio',
];

async function pruneDir(nodeModulesDir) {
  if (!existsSync(nodeModulesDir)) {
    console.log(`[prune-standalone] ${nodeModulesDir} does not exist — skipping`);
    return;
  }

  let totalRemoved = 0;
  let totalSaved = 0;

  for (const pkg of PRUNE_PACKAGES) {
    const pkgPath = join(nodeModulesDir, pkg);
    if (existsSync(pkgPath)) {
      try {
        const s = await stat(pkgPath);
        // du-style size estimate (rough)
        const sizeMB = s.size / 1024 / 1024;
        await rm(pkgPath, { recursive: true, force: true });
        totalRemoved++;
        console.log(`[prune-standalone] removed ${pkg}`);
      } catch (err) {
        console.warn(`[prune-standalone] failed to remove ${pkg}: ${err.message}`);
      }
    }

    // Also check scoped packages: @scope/pkg → nodeModulesDir/@scope/pkg
    // Already handled above since PRUNE_PACKAGES includes full scoped names
  }

  // Also prune .pnpm directory if present (pnpm virtual store in standalone)
  const pnpmDir = join(nodeModulesDir, '.pnpm');
  if (existsSync(pnpmDir)) {
    const entries = await readdir(pnpmDir);
    for (const entry of entries) {
      const shouldPrune = PRUNE_PACKAGES.some(pkg => {
        // Convert scoped package @scope/name → @scope+name for pnpm dir format
        const pnpmName = pkg.replace('/', '+').replace('@', '@');
        return entry.startsWith(pnpmName) || entry.startsWith(pkg.replace('@', '').replace('/', '+'));
      });
      if (shouldPrune) {
        const entryPath = join(pnpmDir, entry);
        try {
          await rm(entryPath, { recursive: true, force: true });
          totalRemoved++;
          console.log(`[prune-standalone] removed .pnpm/${entry}`);
        } catch (err) {
          console.warn(`[prune-standalone] failed to remove .pnpm/${entry}: ${err.message}`);
        }
      }
    }
  }

  console.log(`[prune-standalone] done — removed ${totalRemoved} packages from ${nodeModulesDir}`);
}

await pruneDir(STANDALONE_NODE_MODULES);
