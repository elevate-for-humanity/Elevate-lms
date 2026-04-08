#!/usr/bin/env node
/**
 * Grants audit context CI guard.
 *
 * Policy and rationale: docs/SECURITY.md § "Grants audit context"
 *
 * INVARIANT
 *   Any function that writes to a registered auditable grants table MUST call
 *   setAuditContext(db, { systemActor: '...' }) before the write.
 *
 * HOW IT WORKS
 *   1. Scans all .ts/.tsx files under app/ and lib/
 *   2. Extracts function bodies using brace-walking (handles multi-line
 *      signatures and generic return types like Promise<{ ... }>)
 *   3. For each body: if it writes to a registered auditable table AND does
 *      not call setAuditContext(), it is a violation
 *
 * KNOWN BOUNDARY
 *   Detection uses a 500-char lookahead after .from('table') to find write ops.
 *   This covers chained calls and multi-line patterns. It does NOT cover:
 *     - Write paths hidden behind helper indirection (fn A calls fn B which writes)
 *     - Query construction chains longer than 500 chars before the write op
 *     - Writes split across intermediate variables before execution
 *   CI green = no violations in scanner-recognized patterns, not formal proof.
 *   If a new delegation pattern is introduced, verify manually and add an
 *   exemption comment documenting the reasoning.
 *
 * EXEMPTIONS
 *   Add inside the function body:
 *     // grants-audit: exempt — <reason>
 *   Use only for user-initiated writes where system actor attribution would be
 *   misleading (e.g. mark-read toggles). Never exempt system writes.
 *
 * ADDING A NEW AUDITABLE TABLE
 *   Add it to AUDITABLE_TABLES below. CI enforces immediately on all existing
 *   and future write functions.
 *
 * ACTOR NAMING
 *   Use grants_<module> — e.g. grants_submission_tracker. Strings appear
 *   verbatim in audit records; keep them consistent.
 *
 * EXIT CODES
 *   0 — all writes to auditable tables have audit context or are exempted
 *   1 — violation found (blocks merge)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Tables that require setAuditContext() before any insert/update/upsert.
 * Add new tables here — CI enforces immediately.
 */
const AUDITABLE_TABLES = new Set([
  'grant_federal_forms',
  'grant_packages',
  'entity_eligibility_checks',
  'grant_eligibility_results',
  'grant_notifications',
  'grant_notification_log',
  'grant_submissions',
]);

// ─── Patterns ────────────────────────────────────────────────────────────────

// Matches: .from('table_name') or .from("table_name")
const FROM_RE = /\.from\(['"]([^'"]+)['"]\)/g;

// Matches write operations that follow a .from() call
const WRITE_OP_RE = /\.(insert|update|upsert)\s*\(/;

// Matches audit context call
const AUDIT_CONTEXT_RE = /setAuditContext\s*\(/;

// Exemption comment inside function body
const EXEMPT_RE = /\/\/\s*grants-audit:\s*exempt/;

// ─── File collection ─────────────────────────────────────────────────────────

const ROOT     = path.resolve(__dirname, '..');
const SCAN_DIRS = [
  path.join(ROOT, 'app'),
  path.join(ROOT, 'lib'),
];

function collectFiles(dirs) {
  const results = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    (function walk(d) {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) { walk(full); continue; }
        if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
      }
    })(dir);
  }
  return results;
}

// ─── Function block extraction ───────────────────────────────────────────────

/**
 * Extract function bodies from source as { name, startLine, body } objects.
 *
 * Strategy: find `export async function name` / `async function name` /
 * `function name` declarations, then locate the opening brace of the function
 * body (skipping angle-bracket generics and return type annotations), then
 * walk braces to find the matching close.
 *
 * This correctly handles:
 *   - Multi-line parameter lists
 *   - Generic return types: Promise<{ ... }>
 *   - Nested functions (each block is self-contained)
 */
function extractFunctionBlocks(source) {
  const blocks = [];

  // Match named function declarations (sync and async, exported or not).
  // We capture just the name and position — body extraction is done separately.
  const FN_DECL_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(/g;

  let match;
  while ((match = FN_DECL_RE.exec(source)) !== null) {
    const name = match[1];
    const searchFrom = match.index + match[0].length - 1; // position of '('

    // Walk forward past the parameter list (balanced parens)
    let i = searchFrom;
    let depth = 0;
    while (i < source.length) {
      if (source[i] === '(') depth++;
      else if (source[i] === ')') { depth--; if (depth === 0) { i++; break; } }
      i++;
    }

    // Skip optional return type annotation: `: Promise<{...}>` or `: void` etc.
    // We need to find the `{` that opens the function body, not one inside `<>`.
    // Strategy: skip whitespace, then if we see `:` skip until we find `{` at
    // angle-bracket depth 0 and paren depth 0.
    while (i < source.length && /\s/.test(source[i])) i++;
    if (source[i] === ':') {
      i++; // skip ':'
      let anglDepth = 0;
      let parenDepth = 0;
      while (i < source.length) {
        const ch = source[i];
        if (ch === '<') anglDepth++;
        else if (ch === '>') anglDepth--;
        else if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
        else if (ch === '{' && anglDepth === 0 && parenDepth === 0) break;
        i++;
      }
    }

    // i should now be at the opening `{` of the function body
    if (i >= source.length || source[i] !== '{') continue;

    const braceStart = i;
    let braceDepth = 0;
    while (i < source.length) {
      if (source[i] === '{') braceDepth++;
      else if (source[i] === '}') { braceDepth--; if (braceDepth === 0) break; }
      i++;
    }

    const body = source.slice(braceStart, i + 1);
    const startLine = source.slice(0, braceStart).split('\n').length;
    blocks.push({ name, startLine, body });
  }

  return blocks;
}

// ─── Write detection ─────────────────────────────────────────────────────────

/**
 * Returns the auditable tables written to in a function body.
 * A "write" is: .from('table') followed by .insert/.update/.upsert
 * anywhere in the same function body (not necessarily same line).
 */
function writtenAuditableTables(body) {
  const written = new Set();

  // Collect all .from('table') positions and their table names
  const froms = [];
  let m;
  FROM_RE.lastIndex = 0;
  while ((m = FROM_RE.exec(body)) !== null) {
    if (AUDITABLE_TABLES.has(m[1])) {
      froms.push({ table: m[1], end: m.index + m[0].length });
    }
  }

  // For each .from(auditable), check if a write op appears after it
  // within the same function body (within 500 chars — covers chained calls
  // and multi-line patterns like .from(...)\n  .select(...)\n  .insert(...))
  for (const { table, end } of froms) {
    const window = body.slice(end, end + 500);
    if (WRITE_OP_RE.test(window)) {
      written.add(table);
    }
  }

  return written;
}

// ─── Main scan ───────────────────────────────────────────────────────────────

const files     = collectFiles(SCAN_DIRS);
const violations = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');

  // Skip files that don't reference any auditable table at all
  let hasAuditableRef = false;
  for (const table of AUDITABLE_TABLES) {
    if (source.includes(table)) { hasAuditableRef = true; break; }
  }
  if (!hasAuditableRef) continue;

  const blocks = extractFunctionBlocks(source);

  for (const { name, startLine, body } of blocks) {
    // Exempted
    if (EXEMPT_RE.test(body)) continue;

    const written = writtenAuditableTables(body);
    if (written.size === 0) continue;

    // Has audit context?
    if (AUDIT_CONTEXT_RE.test(body)) continue;

    // Violation
    for (const table of written) {
      violations.push({
        file: path.relative(ROOT, file),
        fn:   name,
        line: startLine,
        table,
      });
    }
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

const REPORT_DIR = path.join(ROOT, 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const report = {
  generated_at: new Date().toISOString(),
  violations,
  auditable_tables: [...AUDITABLE_TABLES],
  files_scanned: files.length,
};
fs.writeFileSync(
  path.join(REPORT_DIR, 'grants_audit_context_report.json'),
  JSON.stringify(report, null, 2)
);

if (violations.length === 0) {
  console.log('[grants-audit-check] All checks passed. No audit context violations found.');
  process.exit(0);
}

console.error('[grants-audit-check] AUDIT CONTEXT VIOLATIONS FOUND:\n');
for (const v of violations) {
  console.error(`  VIOLATION  ${v.file}:${v.line}`);
  console.error(`             function: ${v.fn}`);
  console.error(`             writes to: ${v.table}`);
  console.error(`             missing: setAuditContext(db, { systemActor: '...' })`);
  console.error(`             fix: add setAuditContext() after const db = getDb()`);
  console.error(`             exempt: add // grants-audit: exempt — <reason> inside function`);
  console.error('');
}
console.error(`[grants-audit-check] ${violations.length} violation(s). Resolve before merging.`);
process.exit(1);
