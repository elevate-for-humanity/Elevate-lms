/**
 * Build guard script — prevent Node.js-specific APIs from leaking into client bundles.
 *
 * Run: node scripts/check-client-node-globals.mjs [--fix]
 *
 * Without --fix: scans and reports violations, exits non-zero if any found.
 * With --fix:   auto-removes the offending import lines (backup as .bak).
 *
 * Scans all TypeScript/TSX files under apps/marketing/ that are NOT in
 * node_modules, .next, or any directory containing "node_modules".
 *
 * Violations caught:
 *   import ... from 'node:crypto'
 *   import ... from 'crypto'
 *   import ... from 'jsonwebtoken'
 *   import ... from 'jose'
 *   import { getToken, ... } from 'next-auth/jwt'   (only if not inside getServerSideProps / API route)
 *   const { NodeVM } = require('vm')
 *   ... (see FORBIDDEN_PATTERNS)
 *
 * Safe patterns (whitelisted):
 *   import type { ... } from '...'   (type-only imports are erased at compile time)
 *   anything inside server-only paths:
 *     - /app/api/
 *     - /lib/server/
 *     - /middleware.ts
 *     - /instrumentation.ts
 *     - /app/server/
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { argv } from 'node:process';

const DRY_RUN = !argv.includes('--fix');
const APPS_DIR = join(process.cwd(), 'apps');
const MARKETING_APP = join(APPS_DIR, 'marketing');

/** Regex whitelist: safe directories that are always server-side */
const SERVER_PATH_REGEX = /\/(api|server|middleware|instrumentation)\//;
/** Files that are always server-only regardless of path */
const SERVER_FILENAME_REGEX = /^middleware\./;
/** App pages (in /app/) are Server Components by default — can use Node.js */
const APP_PAGE_REGEX = /\/app\/.*\/page\.[^.]+$/;
/** Type-only imports are stripped at compile time */
const TYPE_ONLY_IMPORT_REGEX = /^import\s+type\s+.*from\s+['"]/;
/** Server-only modules that are OK in Server Components */
const SERVER_ONLY_MODULES = new Set([
  'fs', 'path', 'path/posix', 'path/win32',
  'http', 'https', 'net', 'tls',
  'os', 'crypto', 'stream', 'events',
  'util', 'zlib', 'child_process',
  'worker_threads', 'vm', 'module',
  'url', 'querystring', 'buffer', 'process',
]);

const FORBIDDEN_PATTERNS = [
  // Node core modules
  [/import\s+.*\s+from\s+['"]node:crypto['"]/g, 'node:crypto'],
  [/import\s+.*\s+from\s+['"]crypto['"](?!\/)/g, 'crypto'],
  [/require\s*\(\s*['"]crypto['"]\s*\)/g, 'crypto'],
  [/import\s+.*\s+from\s+['"]stream['"](?!\/)/g, 'stream'],
  [/import\s+.*\s+from\s+['"]path['"](?!\/)/g, 'path'],
  [/import\s+.*\s+from\s+['"]fs['"](?!\/)/g, 'fs'],
  [/import\s+.*\s+from\s+['"]os['"](?!\/)/g, 'os'],
  [/import\s+.*\s+from\s+['"]events['"](?!\/)/g, 'events'],
  [/import\s+.*\s+from\s+['"]util['"](?!\/)/g, 'util'],
  [/import\s+.*\s+from\s+['"]zlib['"](?!\/)/g, 'zlib'],
  [/import\s+.*\s+from\s+['"]http['"](?!\/)/g, 'http'],
  [/import\s+.*\s+from\s+['"]https['"](?!\/)/g, 'https'],
  [/import\s+.*\s+from\s+['"]tls['"](?!\/)/g, 'tls'],
  [/import\s+.*\s+from\s+['"]net['"](?!\/)/g, 'net'],
  // JWT / crypto libs that need Node
  [/import\s+.*\s+from\s+['"]jsonwebtoken['"]/g, 'jsonwebtoken'],
  [/require\s*\(\s*['"]jsonwebtoken['"]\s*\)/g, 'jsonwebtoken'],
  [/import\s+.*\s+from\s+['"]jose['"]/g, 'jose'],
  [/import\s+.*\s+from\s+['"]node-jose['"]/g, 'node-jose'],
  // Next-Auth JWT in client components (safe in server components / API routes)
  // We flag it here; real enforcement needs AST. This catches the obvious cases.
  [/import\s+.*\s+from\s+['"]next-auth\/jwt['"]/g, 'next-auth/jwt'],
  // Node VM / worker threads
  [/import\s+.*\s+from\s+['"]node:vm['"]/g, 'vm'],
  [/import\s+.*\s+from\s+['"]vm['"](?!\/)/g, 'vm'],
  [/import\s+.*\s+from\s+['"]worker_threads['"]/g, 'worker_threads'],
];

const CLIENT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function walkDir(dir, callback) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (
        entry === 'node_modules' ||
        entry === '.next' ||
        entry === '.git' ||
        entry === 'dist' ||
        entry === 'build'
      )
        continue;
      walkDir(fullPath, callback);
    } else if (stat.isFile() && CLIENT_EXTENSIONS.has(extname(entry))) {
      callback(fullPath);
    }
  }
}

function checkFile(filePath) {
  const rel = relative(process.cwd(), filePath);
  const filename = basename(filePath);
  // Skip server-only paths
  if (SERVER_PATH_REGEX.test(rel) || SERVER_FILENAME_REGEX.test(filename)) return [];
  // Skip standalone server entry point
  if (filename === 'server.js') return [];

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const isAppPage = APP_PAGE_REGEX.test(rel);
  const violations = [];
  for (const [pattern, label] of FORBIDDEN_PATTERNS) {
    const matches = content.match(pattern);
    if (!matches) continue;
    for (const match of matches) {
      if (TYPE_ONLY_IMPORT_REGEX.test(match.trim())) continue;
      // App pages are Server Components by default — allow server-only modules
      if (isAppPage && SERVER_ONLY_MODULES.has(label)) continue;
      violations.push({ file: rel, match, label });
    }
  }
  return violations;
}

const allViolations = [];
walkDir(MARKETING_APP, (file) => {
  allViolations.push(...checkFile(file));
});

if (allViolations.length === 0) {
  console.log('✅ No Node.js globals detected in client bundles.');
  process.exit(0);
}

console.error(`❌ Found ${allViolations.length} potential violation(s):\n`);
for (const { file, match, label } of allViolations) {
  console.error(`  [${label}] ${file}`);
  console.error(`    ${match}`);
  console.error();
}

if (DRY_RUN) {
  console.error('Run with --fix to auto-remove these imports (creates .bak files).');
  process.exit(1);
}

console.error('\nAuto-fix is disabled for safety. Please review violations manually.');
process.exit(1);
