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
 * HOW IT WORKS — three detection layers
 *
 *   Layer 1 — Direct writes (statement-boundary scanning)
 *     Detects .from('table').insert/update/upsert() in the same statement.
 *     Walks to statement boundary (semicolon or depth-0 close), so arbitrarily
 *     long chained queries are covered. No fixed character window.
 *
 *   Layer 2 — Intermediate variable writes
 *     Detects: const q = db.from('table'); ... await q.insert/update/upsert()
 *     Tracks variables assigned from .from(auditable_table) and flags write ops
 *     on those variables anywhere in the same function body.
 *
 *   Layer 3 — Single-level local helper indirection
 *     Detects: function A calls function B (defined in the same file) which
 *     writes, where neither A nor B has audit context. Builds a per-file
 *     function map and resolves call sites one level deep.
 *
 * SCOPE AND REMAINING OUT-OF-SCOPE CASES
 *   Within this scanner's intended scope, there are no known detection gaps
 *   for direct writes, intermediate variables, single-level local helper
 *   indirection, or long chained statements.
 *
 *   Remaining out-of-scope cases (not enforced, not expected in this codebase):
 *     - Multi-file indirection: function in file A calls function in file B
 *       which writes. The scanner only resolves calls within the same file.
 *     - Dynamic dispatch: writes triggered via computed function references,
 *       callbacks, or runtime-resolved method calls.
 *
 *   If either pattern is introduced, add an exemption comment with a manual
 *   audit note, or extend the scanner to cover the new pattern.
 *
 * EXEMPTIONS
 *   Add inside the function body:
 *     // grants-audit: exempt — <reason>
 *   Use only for user-initiated writes where system actor attribution would be
 *   misleading (e.g. mark-read toggles). Never exempt system writes.
 *
 * ADDING A NEW AUDITABLE TABLE
 *   Add it to AUDITABLE_TABLES below. CI enforces immediately across all three
 *   detection layers.
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

const FROM_RE       = /\.from\(['"]([^'"]+)['"]\)/g;
const WRITE_OP_RE   = /\.(insert|update|upsert)\s*\(/;
const AUDIT_CTX_RE  = /setAuditContext\s*\(/;
const EXEMPT_RE     = /\/\/\s*grants-audit:\s*exempt/;
const VAR_ASSIGN_RE = /(?:const|let|var)\s+(\w+)\s*=\s*(?:[^;]*?)\.from\(['"]([^'"]+)['"]\)/g;
const FN_CALL_RE    = /\b(\w+)\s*\(/g;

function varWriteRE(varName) {
  return new RegExp(`\\b${varName}\\s*\\.\\s*(?:insert|update|upsert)\\s*\\(`);
}

// ─── File collection ─────────────────────────────────────────────────────────

const ROOT      = path.resolve(__dirname, '..');
const SCAN_DIRS = [path.join(ROOT, 'app'), path.join(ROOT, 'lib')];

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

// ─── Function block extraction ────────────────────────────────────────────────

function extractFunctionBlocks(source) {
  const blocks = [];
  const FN_DECL_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(/g;

  let match;
  while ((match = FN_DECL_RE.exec(source)) !== null) {
    const name = match[1];
    let i = match.index + match[0].length - 1;

    // Walk past parameter list
    let depth = 0;
    while (i < source.length) {
      if (source[i] === '(') depth++;
      else if (source[i] === ')') { depth--; if (depth === 0) { i++; break; } }
      i++;
    }

    // Skip return type annotation
    while (i < source.length && /\s/.test(source[i])) i++;
    if (source[i] === ':') {
      i++;
      let anglDepth = 0, parenDepth = 0;
      while (i < source.length) {
        const ch = source[i];
        if      (ch === '<') anglDepth++;
        else if (ch === '>') anglDepth--;
        else if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
        else if (ch === '{' && anglDepth === 0 && parenDepth === 0) break;
        i++;
      }
    }

    if (i >= source.length || source[i] !== '{') continue;

    const braceStart = i;
    let braceDepth = 0;
    while (i < source.length) {
      if (source[i] === '{') braceDepth++;
      else if (source[i] === '}') { braceDepth--; if (braceDepth === 0) break; }
      i++;
    }

    const body      = source.slice(braceStart, i + 1);
    const startLine = source.slice(0, braceStart).split('\n').length;
    blocks.push({ name, startLine, body });
  }

  return blocks;
}

// ─── Layer 1: Direct write detection (statement-boundary) ────────────────────

/**
 * Walk forward from pos until a statement boundary:
 * semicolon at depth 0, or a closing paren/brace that would exit the chain.
 */
function statementFrom(text, pos) {
  let i = pos;
  let parenDepth = 0, braceDepth = 0;
  while (i < text.length) {
    const ch = text[i];
    if      (ch === '(') parenDepth++;
    else if (ch === ')') { if (parenDepth === 0) break; parenDepth--; }
    else if (ch === '{') braceDepth++;
    else if (ch === '}') { if (braceDepth === 0) break; braceDepth--; }
    else if (ch === ';' && parenDepth === 0 && braceDepth === 0) { i++; break; }
    i++;
  }
  return text.slice(pos, i);
}

function directWrittenTables(body) {
  const written = new Set();
  FROM_RE.lastIndex = 0;
  let m;
  while ((m = FROM_RE.exec(body)) !== null) {
    if (!AUDITABLE_TABLES.has(m[1])) continue;
    const stmt = statementFrom(body, m.index + m[0].length);
    if (WRITE_OP_RE.test(stmt)) written.add(m[1]);
  }
  return written;
}

// ─── Layer 2: Intermediate variable write detection ───────────────────────────

function intermediateVarWrittenTables(body) {
  const written = new Set();
  VAR_ASSIGN_RE.lastIndex = 0;
  let m;
  while ((m = VAR_ASSIGN_RE.exec(body)) !== null) {
    const [, varName, table] = m;
    if (!AUDITABLE_TABLES.has(table)) continue;
    if (varWriteRE(varName).test(body)) written.add(table);
  }
  return written;
}

// ─── Layer 3: Helper indirection detection ────────────────────────────────────

function buildFunctionMap(blocks) {
  const map = new Map();
  for (const { name, body } of blocks) {
    const directTables  = directWrittenTables(body);
    const varTables     = intermediateVarWrittenTables(body);
    map.set(name, {
      body,
      hasAuditCtx:  AUDIT_CTX_RE.test(body),
      isExempt:     EXEMPT_RE.test(body),
      writtenTables: new Set([...directTables, ...varTables]),
    });
  }
  return map;
}

function indirectionViolations(callerBody, fnMap) {
  const violations = [];
  const seen = new Set();
  FN_CALL_RE.lastIndex = 0;
  let m;
  while ((m = FN_CALL_RE.exec(callerBody)) !== null) {
    const callee = m[1];
    if (seen.has(callee)) continue;
    seen.add(callee);
    const calleeDef = fnMap.get(callee);
    if (!calleeDef) continue;
    if (calleeDef.isExempt) continue;
    if (calleeDef.hasAuditCtx) continue;
    if (calleeDef.writtenTables.size === 0) continue;
    for (const table of calleeDef.writtenTables) {
      violations.push({ callee, table });
    }
  }
  return violations;
}

// ─── Main scan ────────────────────────────────────────────────────────────────

const files      = collectFiles(SCAN_DIRS);
const violations = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');

  let hasAuditableRef = false;
  for (const table of AUDITABLE_TABLES) {
    if (source.includes(table)) { hasAuditableRef = true; break; }
  }
  if (!hasAuditableRef) continue;

  const blocks = extractFunctionBlocks(source);
  const fnMap  = buildFunctionMap(blocks);

  for (const { name, startLine, body } of blocks) {
    if (EXEMPT_RE.test(body)) continue;

    // Layers 1 + 2
    const directTables = directWrittenTables(body);
    const varTables    = intermediateVarWrittenTables(body);
    const allWritten   = new Set([...directTables, ...varTables]);

    if (allWritten.size > 0 && !AUDIT_CTX_RE.test(body)) {
      for (const table of allWritten) {
        violations.push({
          file:    path.relative(ROOT, file),
          fn:      name,
          line:    startLine,
          table,
          pattern: varTables.has(table) ? 'intermediate-variable' : 'direct',
        });
      }
    }

    // Layer 3: indirection — only flag if caller also lacks audit context
    if (!AUDIT_CTX_RE.test(body)) {
      for (const { callee, table } of indirectionViolations(body, fnMap)) {
        violations.push({
          file:    path.relative(ROOT, file),
          fn:      name,
          line:    startLine,
          table,
          pattern: `indirection via ${callee}()`,
        });
      }
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const REPORT_DIR = path.join(ROOT, 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

fs.writeFileSync(
  path.join(REPORT_DIR, 'grants_audit_context_report.json'),
  JSON.stringify({
    generated_at:     new Date().toISOString(),
    violations,
    auditable_tables: [...AUDITABLE_TABLES],
    files_scanned:    files.length,
  }, null, 2)
);

if (violations.length === 0) {
  console.log('[grants-audit-check] All checks passed. No audit context violations found.');
  process.exit(0);
}

console.error('[grants-audit-check] AUDIT CONTEXT VIOLATIONS FOUND:\n');
for (const v of violations) {
  console.error(`  VIOLATION  ${v.file}:${v.line}`);
  console.error(`             function : ${v.fn}`);
  console.error(`             table    : ${v.table}`);
  console.error(`             pattern  : ${v.pattern}`);
  console.error(`             fix      : add setAuditContext(db, { systemActor: '...' }) at function entry`);
  console.error(`             exempt   : add // grants-audit: exempt — <reason> inside function`);
  console.error('');
}
console.error(`[grants-audit-check] ${violations.length} violation(s). Resolve before merging.`);
process.exit(1);
