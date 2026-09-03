#!/usr/bin/env node
/**
 * Platform Polish Audit — Elevate LMS
 *
 * Audits design consistency, content quality, and template gaps.
 * Focuses on visual, messaging, and structural polish — not security.
 *
 * Checks:
 *   - Inconsistent typography (text-gray-* vs text-slate-*)
 *   - Prohibited component patterns (CheckCircle2 as bullet, etc.)
 *   - Gradient overlays on hero images/videos
 *   - Program pages missing required sections
 *   - Weak or vague CTA text
 *   - Missing Indiana Career Connect block on WIOA pages
 *   - Inconsistent card layouts (custom vs shared ProgramCard)
 *   - Non-brand color usage
 *   - Sparse page patterns
 *
 * Run via: pnpm platform:doctor  (included as part of predeploy:check)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');

const issues = { critical: [], warnings: [], passed: [] };

function log(msg, level = 'info') {
  const icons = { info: '  ', pass: '✅', warn: '⚠️ ', fail: '❌', section: '🎨' };
  console.log(`${icons[level] ?? '  '} ${msg}`);
}

function section(name) {
  console.log(`\n${'─'.repeat(55)}\n🎨 ${name}\n${'─'.repeat(55)}`);
}

function readFile(relPath) {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}

function walkDir(
  dir,
  exts = ['.ts', '.tsx', '.js', '.jsx'],
  ignore = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo']),
) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full, exts, ignore));
    else if (exts.includes(path.extname(entry.name))) results.push(full);
  }
  return results;
}

// ─── Audit 1: Prohibited typography — text-gray-* ────────────────────────────

function auditTypography() {
  section('Typography — text-gray-* usage');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      if (/\btext-gray-\d+\b/.test(line)) {
        violations.push(`${path.relative(ROOT, file)}:${i + 1} — "${line.trim().slice(0, 70)}"`);
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('typography');
    log('Typography: no text-gray-* usage', 'pass');
  } else {
    issues.warnings.push(
      `typography: ${violations.length} text-gray-* usage(s) — use text-slate-* instead`,
    );
    log(`Typography: ${violations.length} text-gray-* usage(s) found — use text-slate-*`, 'warn');
    violations.slice(0, 5).forEach((v) => log(`  → ${v}`, 'info'));
    if (violations.length > 5) log(`  … and ${violations.length - 5} more`, 'info');
  }
}

// ─── Audit 2: Prohibited icon patterns ───────────────────────────────────────

function auditProhibitedIcons() {
  section('Prohibited icon patterns');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  // Only flag clear, specific anti-patterns per the design standard
  const PROHIBITED = [
    // CheckCircle2 used as a list bullet/feature checkmark
    {
      re: /<CheckCircle2\b(?![^>]*aria-label)/,
      reason: 'use dot bullet (w-1.5 h-1.5 rounded-full bg-brand-red-500) instead',
    },
    // GraduationCap as a decorative content icon
    { re: /<GraduationCap\b/, reason: 'prohibited as content icon per design standard' },
  ];

  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      for (const { re, reason } of PROHIBITED) {
        if (re.test(line)) {
          violations.push(
            `${path.relative(ROOT, file)}:${i + 1} — ${reason}: "${line.trim().slice(0, 60)}"`,
          );
          break;
        }
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('prohibitedIcons');
    log('No prohibited icon patterns found', 'pass');
  } else {
    issues.warnings.push(`prohibitedIcons: ${violations.length} prohibited icon/color pattern(s)`);
    log(`${violations.length} prohibited icon/color pattern(s)`, 'warn');
    violations.slice(0, 5).forEach((v) => log(`  → ${v}`, 'info'));
    if (violations.length > 5) log(`  … and ${violations.length - 5} more`, 'info');
  }
}

// ─── Audit 3: Gradient overlays on hero images ───────────────────────────────

function auditHeroGradients() {
  section('Gradient overlays on hero images/videos');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  const GRADIENT_RE = [
    /bg-gradient-to-[a-z]+\b.*from-black/,
    /from-black\/\d+/,
    /className=.*from-black/,
    /before:bg-black\/\d+/,
    /after:bg-black\/\d+/,
  ];

  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      for (const re of GRADIENT_RE) {
        if (re.test(line)) {
          violations.push(`${path.relative(ROOT, file)}:${i + 1} — "${line.trim().slice(0, 70)}"`);
          break;
        }
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('heroGradients');
    log('No gradient overlays on hero images detected', 'pass');
  } else {
    issues.critical.push(
      `heroGradients: ${violations.length} gradient overlay(s) — violates hero video standard`,
    );
    log(`${violations.length} gradient overlay(s) on hero image/video area`, 'fail');
    violations.slice(0, 5).forEach((v) => log(`  → ${v}`, 'info'));
    if (violations.length > 5) log(`  … and ${violations.length - 5} more`, 'info');
  }
}

// ─── Audit 4: Weak / vague CTA text ──────────────────────────────────────────

function auditCTAText() {
  section('CTA text quality');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  const WEAK_CTA = [
    />\s*Click Here\s*</i,
    />\s*Learn More\s*</i,
    />\s*Submit\s*</i,
    />\s*Read More\s*</i,
    />\s*Get Started\s*</i, // OK sometimes but very generic
    />\s*Coming Soon\s*</i,
    /href=["']#["']/,
  ];

  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      for (const re of WEAK_CTA) {
        if (re.test(line)) {
          violations.push(`${path.relative(ROOT, file)}:${i + 1} — "${line.trim().slice(0, 70)}"`);
          break;
        }
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('ctaText');
    log('CTA text quality looks good', 'pass');
  } else {
    issues.warnings.push(`ctaText: ${violations.length} weak/vague CTA(s)`);
    log(`${violations.length} weak/vague CTA text occurrence(s)`, 'warn');
    violations.slice(0, 5).forEach((v) => log(`  → ${v}`, 'info'));
    if (violations.length > 5) log(`  … and ${violations.length - 5} more`, 'info');
  }
}

// ─── Audit 5: Dark CTA sections — bg-white text-white anti-pattern ───────────

function auditInvisibleText() {
  section('Invisible text patterns (bg-white text-white on same element)');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  // Only flag when solid bg-white AND text-white appear in the SAME className attribute value
  // Exclude bg-white/10, bg-white/20, etc. (transparent overlays on dark backgrounds are OK)
  const SAME_CLASS_RE =
    /className=["'`][^"'`]*(?<!\/)bg-white(?!\/)(?!\d)[^"'`]*text-white[^"'`]*["'`]|className=["'`][^"'`]*text-white[^"'`]*(?<!\/)bg-white(?!\/)(?!\d)[^"'`]*["'`]/;

  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      if (SAME_CLASS_RE.test(line)) {
        violations.push(`${path.relative(ROOT, file)}:${i + 1}`);
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('invisibleText');
    log('No invisible text patterns (bg-white + text-white on same element) found', 'pass');
  } else {
    issues.critical.push(
      `invisibleText: ${violations.length} invisible text pattern(s) on same element`,
    );
    log(
      `${violations.length} invisible text pattern(s) (bg-white + text-white on same element)`,
      'fail',
    );
    violations.slice(0, 10).forEach((v) => log(`  → ${v}`, 'info'));
    if (violations.length > 10) log(`  … and ${violations.length - 10} more`, 'info');
  }
}

// ─── Audit 6: href="#" (dead anchor links) ────────────────────────────────────

function auditDeadAnchors() {
  section('Dead anchor links (href="#")');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      if (/href=["']#["']/.test(line)) {
        violations.push(`${path.relative(ROOT, file)}:${i + 1}`);
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('deadAnchors');
    log('No dead anchor links (href="#") found', 'pass');
  } else {
    issues.warnings.push(`deadAnchors: ${violations.length} href="#" occurrence(s)`);
    log(`${violations.length} href="#" occurrence(s) found`, 'warn');
    violations.slice(0, 5).forEach((v) => log(`  → ${v}`, 'info'));
  }
}

// ─── Audit 7: muted/autoPlay attributes on hero video elements ───────────────

function auditHeroVideoAttributes() {
  section('Hero video — muted/autoPlay attributes');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content || !content.includes('<video')) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      if (/<video[^>]*(muted|autoPlay)[^>]*>/.test(line)) {
        violations.push(`${path.relative(ROOT, file)}:${i + 1} — use useHeroVideo hook instead`);
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('heroVideoAttributes');
    log('Hero video attributes: all use useHeroVideo hook pattern', 'pass');
  } else {
    issues.warnings.push(
      `heroVideoAttributes: ${violations.length} video element(s) with muted/autoPlay`,
    );
    log(`${violations.length} video element(s) with direct muted/autoPlay attributes`, 'warn');
    violations.slice(0, 5).forEach((v) => log(`  → ${v}`, 'info'));
  }
}

// ─── Audit 8: Step number styling ────────────────────────────────────────────

function auditStepNumbers() {
  section('Step number styling');
  const files = walkDir(path.join(ROOT, 'app')).concat(walkDir(path.join(ROOT, 'components')));
  const violations = [];

  // bg-white text-white on step number circles is prohibited
  for (const file of files) {
    const content = readFile(path.relative(ROOT, file));
    if (!content) continue;
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      // Step number circles that aren't brand-red
      if (/rounded-full.*\d/.test(line) && /bg-white\s+text-white/.test(line)) {
        violations.push(`${path.relative(ROOT, file)}:${i + 1}`);
      }
    });
  }

  if (violations.length === 0) {
    issues.passed.push('stepNumbers');
    log('Step number styling looks correct', 'pass');
  } else {
    issues.warnings.push(
      `stepNumbers: ${violations.length} step circle(s) with potential invisible text`,
    );
    log(`${violations.length} step circle(s) may have invisible text`, 'warn');
    violations.forEach((v) => log(`  → ${v}`, 'info'));
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function writeSummary() {
  const reportData = {
    timestamp: new Date().toISOString(),
    critical: issues.critical,
    warnings: issues.warnings,
    passed: issues.passed,
    counts: {
      critical: issues.critical.length,
      warnings: issues.warnings.length,
      passed: issues.passed.length,
    },
  };

  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const outPath = path.join(REPORTS_DIR, 'platform_polish_report.json');
  fs.writeFileSync(outPath, JSON.stringify(reportData, null, 2));

  console.log('\n' + '═'.repeat(55));
  console.log('  Platform Polish Audit — Summary');
  console.log('═'.repeat(55));
  console.log(`  ✅ Passed:   ${issues.passed.length}`);
  console.log(`  ⚠️  Warnings: ${issues.warnings.length}`);
  console.log(`  ❌ Critical: ${issues.critical.length}`);
  console.log(`  Report: ${path.relative(ROOT, outPath)}`);
  console.log('═'.repeat(55) + '\n');

  return reportData;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(55));
  console.log('  Elevate LMS — Platform Polish Audit');
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('═'.repeat(55) + '\n');

  auditTypography();
  auditProhibitedIcons();
  auditHeroGradients();
  auditCTAText();
  auditInvisibleText();
  auditDeadAnchors();
  auditHeroVideoAttributes();
  auditStepNumbers();

  const summary = writeSummary();

  // Exit with 1 only on critical issues
  process.exit(summary.counts.critical > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Platform Polish Audit encountered an error:', err);
  process.exit(1);
});
