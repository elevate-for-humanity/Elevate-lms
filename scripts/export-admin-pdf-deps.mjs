/**
 * Copy pdf-parse → pdfjs-dist → @napi-rs/canvas into /export/pdf-node_modules
 * for LMS + admin Northflank Docker runtimes (same pattern as sharp/ws).
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();
// Northflank/AWS Dockerfiles export ws/sharp under /export; local dev uses ./export
const exportBase = process.env.EXPORT_ROOT ?? join(root, 'export');
const exportRoot = join(exportBase, 'pdf-node_modules');

function copyDir(src, destRelative) {
  // destRelative uses slashes e.g. "@napi-rs/canvas" → export/pdf-node_modules/@napi-rs/canvas
  const dest = join(exportRoot, ...destRelative.split('/'));
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[export-pdf] -> ${destRelative}`);
}

function copyPkg(packageName, destRelative) {
  const pkgJson = require.resolve(`${packageName}/package.json`, { paths: [root] });
  copyDir(dirname(pkgJson), destRelative);
}

function copyPkgAs(packageName, destRelative) {
  const pkgJson = require.resolve(`${packageName}/package.json`, { paths: [root] });
  copyDir(dirname(pkgJson), destRelative);
}

function copyPkgFromDir(srcDir, destRelative) {
  if (!existsSync(srcDir)) {
    throw new Error(`missing ${srcDir}`);
  }
  copyDir(srcDir, destRelative);
}

mkdirSync(exportRoot, { recursive: true });

// Must match node_modules/@napi-rs/{canvas,canvas-linux-x64-gnu} layout
copyPkg('@napi-rs/canvas', '@napi-rs/canvas');

const pnpmDir = join(root, 'node_modules', '.pnpm');

// pdf-parse v2 resolve() points at dist/.../index.cjs (no package.json export) — use pnpm store
const pdfParseStore = readdirSync(pnpmDir).find((e) => e.startsWith('pdf-parse@'));
if (!pdfParseStore) {
  throw new Error('pdf-parse not found under node_modules/.pnpm');
}
copyDir(join(pnpmDir, pdfParseStore, 'node_modules', 'pdf-parse'), 'pdf-parse');

// pdfjs-dist lives in pnpm store (not always hoisted to workspace root)
const pdfjsStore = readdirSync(pnpmDir).find((e) => e.startsWith('pdfjs-dist@'));
if (!pdfjsStore) {
  throw new Error('pdfjs-dist not found under node_modules/.pnpm');
}
copyDir(join(pnpmDir, pdfjsStore, 'node_modules', 'pdfjs-dist'), 'pdfjs-dist');

// Native binding for linux x64 (bookworm admin image)
const canvasNative = readdirSync(pnpmDir).find((e) =>
  e.startsWith('@napi-rs+canvas-linux-x64-gnu@'),
);
if (canvasNative) {
  copyDir(
    join(pnpmDir, canvasNative, 'node_modules', '@napi-rs', 'canvas-linux-x64-gnu'),
    '@napi-rs/canvas-linux-x64-gnu',
  );
} else {
  console.warn('[export-pdf] @napi-rs/canvas-linux-x64-gnu not in pnpm store');
}

const canvasPkg = join(exportRoot, '@napi-rs', 'canvas', 'package.json');
if (!existsSync(canvasPkg)) {
  console.error('[export-pdf] @napi-rs/canvas export failed');
  process.exit(1);
}

const pdfParsePkg = join(exportRoot, 'pdf-parse', 'package.json');
if (!existsSync(pdfParsePkg)) {
  console.error('[export-pdf] pdf-parse export failed (missing package.json)');
  process.exit(1);
}

console.log('[export-pdf] done');
