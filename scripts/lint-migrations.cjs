#!/usr/bin/env node
/**
 * Migration lint checks — run in CI on every PR that touches supabase/migrations/.
 *
 * Checks:
 *   1. Filename convention: YYYYMMDDNNNNNN_description.sql (8-digit date, 6-digit suffix)
 *   2. Comma placement in CREATE TABLE blocks (paren-depth tokenizer)
 *   3. Duplicate table names without IF NOT EXISTS
 *
 * Exit 0 = clean. Exit 1 = issues found (blocks merge).
 */

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../supabase/migrations');
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const issues = [];

// ── 1. Filename convention ────────────────────────────────────────────────────
// Expected: YYYYMMDDNNNNNN_description.sql
// - 8-digit date (YYYYMMDD)
// - 6-digit zero-padded suffix (000001 – 999999)
// - underscore + lowercase description
// - .sql extension
const FILENAME_RE = /^\d{8}\d{6}_[a-z0-9][a-z0-9_]+\.sql$/;

for (const file of files) {
  if (!FILENAME_RE.test(file)) {
    issues.push({
      type: 'BAD_FILENAME',
      file,
      line: 0,
      detail: `Does not match YYYYMMDDNNNNNN_description.sql`,
    });
  }
}

// ── 2. Comma placement (paren-depth tokenizer) ────────────────────────────────
const tableDefs = new Map(); // name → { file, line, hasIfNotExists }

for (const file of files) {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = raw.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*--/.test(lines[i])) continue;

    const tableMatch = lines[i].match(
      /CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(/i,
    );
    if (!tableMatch) continue;

    const hasIfNotExists = !!tableMatch[1];
    const tableName = tableMatch[2].toLowerCase();

    // ── 3. Duplicate without IF NOT EXISTS ──────────────────────────────────
    if (tableDefs.has(tableName) && !hasIfNotExists) {
      issues.push({
        type: 'UNSAFE_DUPLICATE',
        file,
        line: i + 1,
        detail: `"${tableName}" already defined in ${tableDefs.get(tableName).file}:${tableDefs.get(tableName).line} without IF NOT EXISTS`,
      });
    }
    if (!tableDefs.has(tableName)) {
      tableDefs.set(tableName, { file, line: i + 1 });
    }

    // ── Extract block ────────────────────────────────────────────────────────
    let depth = 0,
      blockEnd = i;
    for (let j = i; j < lines.length; j++) {
      const nc = lines[j].replace(/--.*$/, '');
      let inStr = false,
        sc = '';
      for (const ch of nc) {
        if (inStr) {
          if (ch === sc) inStr = false;
        } else if (ch === "'" || ch === '"') {
          inStr = true;
          sc = ch;
        } else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      if (j > i && depth === 0) {
        blockEnd = j;
        break;
      }
    }

    // ── Tokenize column definitions ──────────────────────────────────────────
    depth = 0;
    const cols = []; // { startIdx, endIdx }

    for (let j = i; j <= blockEnd; j++) {
      const nc = lines[j].replace(/--.*$/, '');
      const trimmed = nc.trim();
      const depthBefore = depth;
      let inStr = false,
        sc = '';
      for (const ch of nc) {
        if (inStr) {
          if (ch === sc) inStr = false;
        } else if (ch === "'" || ch === '"') {
          inStr = true;
          sc = ch;
        } else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      if (j === i) continue;
      if (depth === 0 && trimmed.startsWith(')')) break;
      // Skip lines inside string literals (e.g., multi-line DEFAULT JSON values)
      if (inStr) continue;
      if (
        depthBefore === 1 &&
        trimmed &&
        !/^,?\s*(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY|EXCLUDE)\b/i.test(trimmed)
      ) {
        let colDepth = depth,
          endIdx = j;
        if (colDepth > 1) {
          // Column definition started inside a nested paren — walk until it closes.
          for (let k = j + 1; k <= blockEnd; k++) {
            const knc = lines[k].replace(/--.*$/, '');
            let kInStr = false,
              kSc = '';
            for (const ch of knc) {
              if (kInStr) {
                if (ch === kSc) kInStr = false;
              } else if (ch === "'" || ch === '"') {
                kInStr = true;
                kSc = ch;
              } else if (ch === '(') colDepth++;
              else if (ch === ')') colDepth--;
            }
            if (colDepth <= 1) {
              endIdx = k;
              break;
            }
          }
        } else {
          // Top-level column (depth === 1). Check if the immediately following
          // non-blank line is an inline CHECK constraint continuation. If so,
          // advance endIdx to that line so the comma check uses the CHECK line
          // (which carries the separator comma) rather than the column start line.
          for (let k = j + 1; k <= blockEnd; k++) {
            const knc = lines[k].replace(/--.*$/, '').trim();
            if (!knc) continue; // skip blank lines
            if (/^CHECK\s*\(/i.test(knc)) {
              // Walk to the closing paren of the CHECK expression
              let ckDepth = 0;
              for (let m = k; m <= blockEnd; m++) {
                const mnc = lines[m].replace(/--.*$/, '');
                let mInStr = false, mSc = '';
                for (const ch of mnc) {
                  if (mInStr) { if (ch === mSc) mInStr = false; }
                  else if (ch === "'" || ch === '"') { mInStr = true; mSc = ch; }
                  else if (ch === '(') ckDepth++;
                  else if (ch === ')') ckDepth--;
                }
                if (ckDepth <= 0) { endIdx = m; break; }
              }
            }
            break; // only look at the first non-blank continuation line
          }
        }
        cols.push({ startIdx: j, endIdx });
      }
    }

    // ── Check comma placement on end lines ───────────────────────────────────
    for (let k = 0; k < cols.length; k++) {
      const { startIdx, endIdx } = cols[k];
      const isLast = k === cols.length - 1;
      const endLine = lines[endIdx];
      const commentStart = endLine.search(/(?<!')--.*/);
      const codePart = commentStart >= 0 ? endLine.slice(0, commentStart) : endLine;
      const codeTrimed = codePart.trimEnd();
      const hasComma = codeTrimed.endsWith(',');

      // Multi-line column definitions (e.g. column + inline CHECK constraint) have
      // their separator comma on the CHECK continuation line, not on the column's
      // start line. When endIdx > startIdx and the end line already carries the
      // comma, the column is correctly terminated — skip the MISSING_COMMA check.
      const isMultiLine = endIdx > startIdx;

      // Skip MISSING_COMMA for multi-line columns that have their comma on the end line
      if (!isLast && !hasComma && !(isMultiLine && endLine.trim().endsWith(','))) {
        issues.push({
          type: 'MISSING_COMMA',
          file,
          line: endIdx + 1,
          detail: codeTrimed.trim().slice(0, 80),
        });
      }

      // If the next non-blank line is a table constraint, a trailing comma on the
      // last column is valid and required (e.g. "created_at ...," before UNIQUE()).
      let nextNonBlank = '';
      for (let n = endIdx + 1; n <= blockEnd; n++) {
        const candidate = lines[n].replace(/--.*$/, '').trim();
        if (!candidate) continue;
        nextNonBlank = candidate;
        break;
      }
      const nextIsTableConstraint = /^,?\s*(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY|EXCLUDE)\b/i.test(nextNonBlank);

      // For multi-line columns the comma on the CHECK line is the separator for
      // the *next* column, not a trailing comma on the last column. Only flag
      // TRAILING_COMMA when there is no following table constraint.
      if (isLast && hasComma && !isMultiLine && !nextIsTableConstraint) {
        issues.push({
          type: 'TRAILING_COMMA',
          file,
          line: endIdx + 1,
          detail: codeTrimed.trim().slice(0, 80),
        });
      }
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
if (issues.length === 0) {
  console.log(`✅ Migration lint passed — ${files.length} files, 0 issues`);
  process.exit(0);
}

const byType = {};
for (const i of issues) {
  byType[i.type] = byType[i.type] || [];
  byType[i.type].push(i);
}

console.error(`❌ Migration lint failed — ${issues.length} issue(s) in ${files.length} files\n`);
for (const [type, items] of Object.entries(byType)) {
  console.error(`${type} (${items.length}):`);
  items.forEach((i) => console.error(`  ${i.file}:${i.line}  ${i.detail}`));
  console.error('');
}
process.exit(1);
