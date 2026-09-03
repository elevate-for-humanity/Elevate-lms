/**
 * Fail fast when PDF native stack is incomplete (Northflank runtime stage).
 * Usage: NODE_PATH=/app/node_modules node scripts/verify-pdf-runtime.mjs [label]
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const label = process.argv[2] ?? 'pdf';
const nodePath = process.env.NODE_PATH ?? 'node_modules';

function pkgPath(root, ...segments) {
  return join(root, ...segments);
}

const roots = nodePath.split(':').filter(Boolean);
let canvasDir = null;
let nativeDir = null;
let pdfParseDir = null;

for (const root of roots) {
  if (!canvasDir && existsSync(pkgPath(root, '@napi-rs', 'canvas', 'package.json'))) {
    canvasDir = pkgPath(root, '@napi-rs', 'canvas');
  }
  if (
    !nativeDir &&
    existsSync(pkgPath(root, '@napi-rs', 'canvas-linux-x64-gnu', 'package.json'))
  ) {
    nativeDir = pkgPath(root, '@napi-rs', 'canvas-linux-x64-gnu');
  }
  if (!pdfParseDir && existsSync(pkgPath(root, 'pdf-parse', 'package.json'))) {
    pdfParseDir = pkgPath(root, 'pdf-parse');
  }
}

const missing = [];
if (!canvasDir) missing.push('@napi-rs/canvas');
if (!nativeDir) missing.push('@napi-rs/canvas-linux-x64-gnu');
if (!pdfParseDir) missing.push('pdf-parse');

if (missing.length) {
  console.error(`[${label}] missing packages: ${missing.join(', ')}`);
  process.exit(1);
}

const nativeNode = join(nativeDir, 'skia.linux-x64-gnu.node');
if (!existsSync(nativeNode)) {
  console.error(`[${label}] missing native binding: ${nativeNode}`);
  process.exit(1);
}

const probe = spawnSync(
  process.execPath,
  ['-e', "require('@napi-rs/canvas'); require('pdf-parse');"],
  { env: { ...process.env, NODE_PATH: nodePath }, stdio: 'pipe' },
);

if (probe.status !== 0) {
  const detail = probe.stderr?.toString() || probe.stdout?.toString() || 'unknown';
  console.error(`[${label}] require failed: ${detail}`);
  process.exit(1);
}

console.log(`[${label}] pdf runtime ok`);
