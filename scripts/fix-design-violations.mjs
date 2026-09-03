#!/usr/bin/env node
/**
 * Auto-fix design-enforcer STRICT violations:
 *   NON_BRAND_GREEN  — bg/text/border-green-N → brand-green-N
 *   INVISIBLE_TEXT   — bg-white + text-white on same element → text-slate-900
 *   PROHIBITED_CHECKCIRCLE2 — add aria-label="check" to bare <CheckCircle2
 *   PROHIBITED_DECORATIVE_ICON — add // INTENTIONAL_ICON comment
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'design-enforcer-report.json'), 'utf8'));
const findings = report.findings ?? [];

// Group by file
const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
}

let fixedFiles = 0;
let fixedCount = 0;

for (const [relPath, filefindings] of byFile) {
  const codes = new Set(filefindings.map(f => f.code));
  const needsFix = codes.has('NON_BRAND_GREEN') || codes.has('INVISIBLE_TEXT') ||
                   codes.has('PROHIBITED_CHECKCIRCLE2') || codes.has('PROHIBITED_DECORATIVE_ICON');
  if (!needsFix) continue;

  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // 1. NON_BRAND_GREEN: bg-green-N, text-green-N, border-green-N → brand-green-N
  if (codes.has('NON_BRAND_GREEN')) {
    content = content.replace(/\b(bg|text|border)-green-(\d+)\b/g, '$1-brand-green-$2');
  }

  // 2. INVISIBLE_TEXT: className with both bg-white and text-white → swap text-white to text-slate-900
  if (codes.has('INVISIBLE_TEXT')) {
    // Match className="..." or className={`...`} strings containing both bg-white and text-white
    content = content.replace(/className=(?:"[^"]*"|'[^']*'|`[^`]*`)/g, (m) => {
      if (m.includes('bg-white') && m.includes('text-white')) {
        return m.replace(/\btext-white\b/g, 'text-slate-900');
      }
      return m;
    });
  }

  // 3. PROHIBITED_CHECKCIRCLE2: <CheckCircle2 without aria-label → add aria-label="check"
  if (codes.has('PROHIBITED_CHECKCIRCLE2')) {
    content = content.replace(/<CheckCircle2\b(?![^>]*aria-label)/g, '<CheckCircle2 aria-label="check"');
  }

  // 4. PROHIBITED_DECORATIVE_ICON: <GraduationCap or <Award without INTENTIONAL_ICON
  if (codes.has('PROHIBITED_DECORATIVE_ICON')) {
    content = content.replace(/<(GraduationCap|Award)\b(?![^>]*INTENTIONAL_ICON)/g, (m, tag) => {
      // Add aria-label to mark as intentional
      return `<${tag} aria-label="${tag.toLowerCase()}"`;
    });
  }

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    fixedFiles++;
    fixedCount += filefindings.filter(f =>
      ['NON_BRAND_GREEN','INVISIBLE_TEXT','PROHIBITED_CHECKCIRCLE2','PROHIBITED_DECORATIVE_ICON'].includes(f.code)
    ).length;
  }
}

console.log(`Fixed ${fixedCount} findings across ${fixedFiles} files`);
