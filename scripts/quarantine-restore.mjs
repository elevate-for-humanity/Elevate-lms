#!/usr/bin/env node
/**
 * quarantine-restore.mjs
 *
 * Restores a quarantined route back to its live path.
 *
 *   pnpm quarantine:restore <route>
 *   pnpm quarantine:restore /api/admin/users
 *   pnpm quarantine:restore --all          # restore everything
 *   pnpm quarantine:restore --list         # list all quarantined routes
 *
 * After restoring, run:
 *   pnpm quarantine:manifest   # rebuild the manifest
 *   pnpm quarantine:audit      # verify clean state
 */

import { existsSync, renameSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { globSync } from 'glob';

const ROOT = process.cwd();
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: pnpm quarantine:restore <route>');
  console.error('       pnpm quarantine:restore --all');
  console.error('       pnpm quarantine:restore --list');
  process.exit(1);
}

function isQuarantined(filePath) {
  return filePath.split('/').some((seg) => seg.startsWith('__'));
}

function quarantinedToLive(filePath) {
  return filePath.replace(/\/__([^/]+)/g, '/$1');
}

function appPathToRoute(filePath) {
  return (
    filePath
      .replace(/^app/, '')
      .replace(/\/page\.tsx$/, '')
      .replace(/\/route\.ts$/, '')
      .replace(/\/\(app\)/, '')
      .replace(/\/\(auth\)/, '')
      .replace(/\/\(dashboard\)/, '')
      .replace(/\/\(partner\)/, '')
      .replace(/\/\(public\)/, '')
      .replace(/\/layout\.tsx$/, '') || '/'
  );
}

// Find the quarantined directory for a given route
function findQuarantinedDir(targetRoute) {
  // Normalize route
  const route = targetRoute.startsWith('/') ? targetRoute : '/' + targetRoute;

  // Find all quarantined page.tsx / route.ts files
  const quarantinedFiles = globSync('app/**/+(page.tsx|route.ts)', {
    cwd: ROOT,
    ignore: ['node_modules/**', '.next/**'],
  }).filter(isQuarantined);

  const matches = [];
  for (const file of quarantinedFiles) {
    const liveFile = quarantinedToLive(file);
    const fileRoute = appPathToRoute(liveFile);
    if (fileRoute === route || fileRoute.startsWith(route + '/')) {
      // Find the quarantined directory (the one with __ prefix)
      const parts = file.split('/');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('__')) {
          const quarantinedDir = parts.slice(0, i + 1).join('/');
          if (!matches.includes(quarantinedDir)) {
            matches.push(quarantinedDir);
          }
          break;
        }
      }
    }
  }
  return matches;
}

function restoreDir(quarantinedDir) {
  const liveDir = quarantinedToLive(quarantinedDir);
  const absQuarantined = join(ROOT, quarantinedDir);
  const absLive = join(ROOT, liveDir);

  if (!existsSync(absQuarantined)) {
    console.error(`Not found: ${quarantinedDir}`);
    return false;
  }

  if (existsSync(absLive)) {
    console.error(`Live path already exists: ${liveDir}`);
    return false;
  }

  mkdirSync(dirname(absLive), { recursive: true });
  renameSync(absQuarantined, absLive);
  console.log(`✅ Restored: ${quarantinedDir} → ${liveDir}`);
  return true;
}

// ── --list ───────────────────────────────────────────────────────────────────
if (args[0] === '--list') {
  const quarantinedFiles = globSync('app/**/+(page.tsx|route.ts)', {
    cwd: ROOT,
    ignore: ['node_modules/**', '.next/**'],
  }).filter(isQuarantined);

  // Deduplicate by quarantined dir
  const dirs = new Set();
  for (const file of quarantinedFiles) {
    const parts = file.split('/');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('__')) {
        dirs.add(parts.slice(0, i + 1).join('/'));
        break;
      }
    }
  }

  const sorted = [...dirs].sort();
  console.log(`\nQuarantined directories (${sorted.length}):\n`);
  for (const dir of sorted) {
    const route = appPathToRoute(quarantinedToLive(dir));
    console.log(`  ${route.padEnd(60)} ${dir}`);
  }
  console.log(`\nRestore with: pnpm quarantine:restore <route>`);
  process.exit(0);
}

// ── --all ────────────────────────────────────────────────────────────────────
if (args[0] === '--all') {
  const quarantinedFiles = globSync('app/**/+(page.tsx|route.ts)', {
    cwd: ROOT,
    ignore: ['node_modules/**', '.next/**'],
  }).filter(isQuarantined);

  const dirs = new Set();
  for (const file of quarantinedFiles) {
    const parts = file.split('/');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('__')) {
        dirs.add(parts.slice(0, i + 1).join('/'));
        break;
      }
    }
  }

  let count = 0;
  for (const dir of [...dirs].sort()) {
    if (restoreDir(dir)) count++;
  }
  console.log(`\nRestored ${count} director${count === 1 ? 'y' : 'ies'}.`);
  console.log('Run: pnpm quarantine:manifest && pnpm quarantine:audit');
  process.exit(0);
}

// ── Restore specific route ───────────────────────────────────────────────────
const targetRoute = args[0];
const matches = findQuarantinedDir(targetRoute);

if (matches.length === 0) {
  console.error(`No quarantined directory found for route: ${targetRoute}`);
  console.error('Run: pnpm quarantine:restore --list');
  process.exit(1);
}

let count = 0;
for (const dir of matches) {
  if (restoreDir(dir)) count++;
}

if (count > 0) {
  console.log(`\nRestored ${count} director${count === 1 ? 'y' : 'ies'} for route ${targetRoute}`);
  console.log('Run: pnpm quarantine:manifest && pnpm quarantine:audit');
}
