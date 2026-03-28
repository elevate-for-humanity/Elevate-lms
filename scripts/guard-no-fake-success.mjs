#!/usr/bin/env node
/**
 * Reliability guard: blocks fake-success, silent-failure, and raw-JSON-on-POST patterns.
 *
 * Run: node scripts/guard-no-fake-success.mjs
 * Exits 1 on any violation. Wire into CI so merges fail hard.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'lib', 'components'];
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const violations = [];

// Scope: only user-facing revenue/enrollment/booking/payment/application paths
const SCOPED_PATHS = [
  'app/api/enroll/',
  'app/api/enrollment/',
  'app/api/booking/',
  'app/api/apply',
  'app/api/tax/',
  'app/api/store/',
  'app/api/stripe/',
  'app/api/license/',
  'app/api/payments/',
  'app/api/programs/',
  'app/api/partners/',
  'app/api/supersonic/',
  'app/api/funnel/',
  'app/api/intake',
  'app/api/auth/signout',
  'components/ApplicationForm',
  'lib/enrollment/',
];

function isInScope(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  return SCOPED_PATHS.some(p => rel.includes(p));
}

const bannedPatterns = [
  {
    name: 'fake-success-in-catch',
    // Match try/catch blocks (not .catch() promise chains) containing success:true
    regex: /\}\s*catch\s*[\(\{][^}]{0,800}?success\s*:\s*true[^}]{0,800}?\}/gs,
    message:
      'Fake success returned inside catch block. Failures must return non-2xx — never success:true.',
    scopedOnly: true,
  },
  {
    name: 'dont-block-flow',
    regex: /don'?t block flow|continue even if database insert fails|still return success/gi,
    message:
      'Banned failure-handling comment found. Persistence failures must fail the request, not fall through.',
    scopedOnly: true,
  },
  {
    name: 'timestamp-fake-id',
    // Flag timestamp IDs used as fake enrollment/application/confirmation IDs.
    // Excludes payments/split (legitimate external vendor reference ID pattern).
    regex: /[`'"][A-Z]+-\$\{Date\.now\(\)\}[`'"]/g,
    message:
      'Timestamp-based fake ID detected. IDs must come from the DB — never generated on failure.',
    scopedOnly: true,
    excludePaths: ['app/api/payments/split'],
  },
];

// (Broad JSON-error check removed — too noisy across 1,000+ routes.
//  Native-POST redirect enforcement is handled by guard-critical-routes.mjs
//  for the specific routes that matter.)

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build', '.git'].includes(entry.name)) continue;
      walk(full);
    } else if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      checkFile(full);
    }
  }
}

function lineAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

function checkFile(file) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { return; }

  for (const rule of bannedPatterns) {
    if (rule.scopedOnly && !isInScope(file)) continue;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (rule.excludePaths?.some(p => rel.includes(p))) continue;
    rule.regex.lastIndex = 0;
    for (const match of content.matchAll(rule.regex)) {
      violations.push({
        file: path.relative(ROOT, file),
        line: lineAt(content, match.index ?? 0),
        rule: rule.name,
        message: rule.message,
        excerpt: match[0].slice(0, 180).replace(/\s+/g, ' ').trim(),
      });
    }
  }


}

for (const dir of TARGET_DIRS) {
  walk(path.join(ROOT, dir));
}

if (violations.length) {
  console.error('\n❌ Reliability guard failed — banned patterns found:\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`  [${v.rule}] ${v.message}`);
    if (v.excerpt) console.error(`  → ${v.excerpt}`);
    console.error('');
  }
  console.error(`${violations.length} violation(s). Fix before merging.\n`);
  process.exit(1);
}

console.log('✅ Reliability guard passed: no fake-success or silent-failure patterns found.');
