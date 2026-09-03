#!/usr/bin/env node
/**
 * Replace <CheckCircle2 ... /> with a brand dot bullet span.
 * The design enforcer prohibits CheckCircle2 entirely — no exemption.
 * Replacement: <span className="inline-block w-4 h-4 rounded-full bg-brand-blue-600 flex-shrink-0" aria-hidden="true" />
 * Preserves className overrides where possible.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'design-enforcer-report.json'), 'utf8'));
const findings = report.findings ?? [];

const affectedFiles = [...new Set(
  findings.filter(f => f.code === 'PROHIBITED_CHECKCIRCLE2').map(f => f.file)
)];

let fixedFiles = 0;
let fixedCount = 0;

for (const relPath of affectedFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // Replace self-closing <CheckCircle2 ... />
  // Capture the className prop if present so we can forward it
  content = content.replace(/<CheckCircle2\b([^>]*?)\/>/g, (match, attrs) => {
    const classMatch = attrs.match(/className=(?:"([^"]*)"|'([^']*)'|`([^`]*)`|\{([^}]*)\})/);
    const cls = classMatch
      ? (classMatch[1] ?? classMatch[2] ?? classMatch[3] ?? classMatch[4] ?? '')
      : 'w-4 h-4 text-brand-blue-600';
    // Convert text-* color to bg-* for the dot
    const bgColor = cls.match(/\btext-([\w-]+)\b/)?.[1] ?? 'brand-blue-600';
    const sizeClass = cls.match(/\bw-(\S+)\b/)?.[0] ?? 'w-4';
    const hClass = cls.match(/\bh-(\S+)\b/)?.[0] ?? 'h-4';
    const extraClasses = cls.replace(/\btext-[\w-]+\b/, '').replace(/\bw-\S+\b/, '').replace(/\bh-\S+\b/, '').trim();
    return `<span className="${sizeClass} ${hClass} rounded-full bg-${bgColor} inline-block flex-shrink-0 ${extraClasses}".trim() aria-hidden="true" />`;
  });

  // Replace non-self-closing <CheckCircle2 ...> ... </CheckCircle2> (rare)
  content = content.replace(/<CheckCircle2\b([^>]*)>[\s\S]*?<\/CheckCircle2>/g, (match, attrs) => {
    const classMatch = attrs.match(/className=(?:"([^"]*)"|'([^']*)')/);
    const cls = classMatch ? (classMatch[1] ?? classMatch[2] ?? 'w-4 h-4 text-brand-blue-600') : 'w-4 h-4 text-brand-blue-600';
    const bgColor = cls.match(/\btext-([\w-]+)\b/)?.[1] ?? 'brand-blue-600';
    const sizeClass = cls.match(/\bw-(\S+)\b/)?.[0] ?? 'w-4';
    const hClass = cls.match(/\bh-(\S+)\b/)?.[0] ?? 'h-4';
    return `<span className="${sizeClass} ${hClass} rounded-full bg-${bgColor} inline-block flex-shrink-0" aria-hidden="true" />`;
  });

  // Remove CheckCircle2 from import statements
  content = content.replace(/,\s*CheckCircle2\b/g, '');
  content = content.replace(/\bCheckCircle2\s*,\s*/g, '');
  content = content.replace(/\bCheckCircle2\b/g, ''); // catch any remaining bare references

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    fixedFiles++;
    fixedCount += findings.filter(f => f.code === 'PROHIBITED_CHECKCIRCLE2' && f.file === relPath).length;
  }
}

console.log(`Replaced CheckCircle2 in ${fixedCount} locations across ${fixedFiles} files`);
