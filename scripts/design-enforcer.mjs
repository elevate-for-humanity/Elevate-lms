#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

const args = new Set(process.argv.slice(2));
const BASELINE_MODE = args.has('--baseline');
const STRICT_MODE = args.has('--strict');
const BASELINE_FILE = process.env.DESIGN_ENFORCER_BASELINE;
const JSON_MODE = args.has('--json');
const QUIET = args.has('--quiet');
const IS_MAIN = process.env.GITHUB_REF_NAME === 'main' || process.env.GITHUB_REF === 'refs/heads/main';

const findings = [];

function addFinding(severity, code, file, line, message) {
  findings.push({ severity, code, file, line, message });
}

function walk(dir, exts = new Set(['.tsx', '.jsx'])) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function scanFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  const content = fs.readFileSync(absPath, 'utf8');

  // Release-blocking rules are limited to defects that can create duplicated
  // architecture, dead interaction, invisible content, or broken hero/media
  // behavior. Cosmetic design-system consistency remains visible as REPORT debt
  // and is completed during Release 2 rather than blocking Release 1.

  // 1) no custom program cards when shared ProgramCard exists
  const isSharedComponentDir = /^components\//.test(rel);
  if (!isSharedComponentDir && /function\s+ProgramCard\b|const\s+ProgramCard\s*=/.test(content)) {
    const idx = content.search(/function\s+ProgramCard\b|const\s+ProgramCard\s*=/);
    addFinding('STRICT', 'CUSTOM_PROGRAM_CARD', rel, lineNumber(content, idx), 'Custom program card detected. Use shared components/programs/ProgramCard.tsx');
  }

  // 2) cosmetic token consistency — report, do not block Release 1
  const greenRe = /\b(?:bg|text|border)-green-\d+\b/g;
  for (const m of content.matchAll(greenRe)) {
    addFinding('REPORT', 'NON_BRAND_GREEN', rel, lineNumber(content, m.index), `Use brand-green-* token instead of ${m[0]}`);
  }

  // 3) bullet/icon consistency — report for Release 2
  const checkCircleRe = /<CheckCircle2\b/g;
  for (const m of content.matchAll(checkCircleRe)) {
    addFinding('REPORT', 'PROHIBITED_CHECKCIRCLE2', rel, lineNumber(content, m.index), 'CheckCircle2 used. Replace with brand dot bullet where decorative.');
  }

  // 4) decorative accessibility intent — report unless it creates a functional defect
  const decoRe = /<(GraduationCap|Award)\b/g;
  for (const m of content.matchAll(decoRe)) {
    const start = Math.max(0, m.index - 160);
    const end = Math.min(content.length, m.index + 240);
    const window = content.slice(start, end);
    if (!/aria-label=|title=|INTENTIONAL_ICON/.test(window)) {
      addFinding('REPORT', 'PROHIBITED_DECORATIVE_ICON', rel, lineNumber(content, m.index), `${m[1]} appears decorative without accessibility intent marker`);
    }
  }

  // 5) weak CTA copy — report as polish; dead CTAs are blocked separately below
  const weakCtas = [/\bLearn More\b/g, /\bClick Here\b/g, /\bSubmit\b/g, /\bExplore\b/g];
  const lines = content.split('\n');
  for (const re of weakCtas) {
    for (const m of content.matchAll(re)) {
      const lineIdx = lineNumber(content, m.index) - 1;
      const lineText = lines[lineIdx] ?? '';
      if (/design-ok/.test(lineText)) continue;
      if (/type=["']submit["']/.test(lineText)) continue;
      if (/^\s*[•\-\*]/.test(lineText)) continue;
      if (/\bSubmitting\b|\bExploring\b|\bLearning\b/.test(lineText)) continue;
      if (/\/\/|\/\*|\*\/|\{\/\*/.test(lineText)) continue;
      const isButtonLabel =
        />[\s]*(?:Learn More|Click Here|Submit|Explore)[\s]*</.test(lineText) ||
        /(?:children|label|text|buttonText|cta)=["'](?:Learn More|Click Here|Submit|Explore)["']/.test(lineText) ||
        /\bbutton\b.*(?:Learn More|Click Here|Submit|Explore)|(?:Learn More|Click Here|Submit|Explore).*\bbutton\b/i.test(lineText);
      if (!isButtonLabel) continue;
      addFinding('REPORT', 'WEAK_CTA_COPY', rel, lineNumber(content, m.index), `Weak CTA copy found: "${m[0]}"`);
    }
  }

  // 6) dead href="#" is a real interaction blocker
  const deadHrefRe = /href=["']#["']/g;
  for (const m of content.matchAll(deadHrefRe)) {
    addFinding('STRICT', 'DEAD_HREF', rel, lineNumber(content, m.index), 'Dead CTA/link href="#" detected');
  }

  // 7) invisible foreground/background combination is blocking
  const classRe = /className=["'`][^"'`]*["'`]/g;
  for (const m of content.matchAll(classRe)) {
    if (/\bbg-white\b/.test(m[0]) && /\btext-white\b/.test(m[0])) {
      addFinding('STRICT', 'INVISIBLE_TEXT', rel, lineNumber(content, m.index), 'className contains bg-white and text-white on the same element');
    }
  }

  // 8) hero image/video without approved treatment is blocking because it can
  // recreate the blinking/multi-layer hero defects this recovery is removing.
  if (/hero/i.test(rel) || /Hero/.test(content)) {
    if (/<video\b/.test(content) && !/useHeroVideo|HeroVideo/.test(content)) {
      const idx = content.search(/<video\b/);
      addFinding('STRICT', 'HERO_VIDEO_TREATMENT', rel, lineNumber(content, idx), 'Hero video should use approved HeroVideo/useHeroVideo treatment');
    }
    if (/<Image\b|<img\b/.test(content) && /from-black\/|from-gray-900|from-slate-900/.test(content)) {
      const idx = content.search(/from-black\/|from-gray-900|from-slate-900/);
      addFinding('STRICT', 'HERO_OVERLAY_TREATMENT', rel, lineNumber(content, idx), 'Hero media uses prohibited dark overlay. Use from-brand-blue-900/* instead.');
    }
  }

  // 9) non-standard container width is polish unless it proves clipping in live QA
  const maxWRe = /\bmax-w-\[[^\]]+\]|\bmax-w-(8xl|9xl|10xl)\b/g;
  for (const m of content.matchAll(maxWRe)) {
    const val = m[0];
    if (/calc\(|vw|vh|%|\//.test(val)) continue;
    addFinding('REPORT', 'INCONSISTENT_CONTAINER', rel, lineNumber(content, m.index), `Non-standard max-width pattern ${val} detected`);
  }

  const reportPatterns = [
    { re: /\btext-gray-\d+\b/g, code: 'REPORT_TYPOGRAPHY', msg: 'Use text-slate-* tokens for typography consistency' },
    { re: /\bspace-y-\[\d+px\]/g, code: 'REPORT_SPACING', msg: 'Custom spacing token detected; prefer design tokens' },
  ];
  for (const p of reportPatterns) {
    for (const m of content.matchAll(p.re)) {
      addFinding('REPORT', p.code, rel, lineNumber(content, m.index), p.msg);
    }
  }
}

function writeReport(report) {
  if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });
  const out = path.join(ARTIFACTS, 'design-enforcer-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return out;
}

function main() {
  // Scan the three actual production application trees plus shared components.
  // Legacy roots are audited separately during Release 2 and must not substitute
  // for production coverage.
  const roots = [
    path.join(ROOT, 'apps', 'marketing', 'app'),
    path.join(ROOT, 'apps', 'lms', 'app'),
    path.join(ROOT, 'apps', 'admin', 'app'),
    path.join(ROOT, 'components'),
  ];
  const files = [...new Set(roots.flatMap((root) => walk(root)))];
  for (const file of files) scanFile(file);

  let baselineSet = new Set();
  if (BASELINE_MODE && BASELINE_FILE) {
    try {
      baselineSet = new Set(fs.readFileSync(BASELINE_FILE, 'utf8').split('\n').filter(Boolean));
    } catch {}
  }
  const filteredFindings = BASELINE_MODE
    ? findings.filter((f) => !baselineSet.has(`${f.file}:${f.line}:${f.code}`))
    : findings;

  const summary = { counts: { CRITICAL: 0, STRICT: 0, REPORT: 0 }, topFiles: [] };
  for (const f of filteredFindings) summary.counts[f.severity] = (summary.counts[f.severity] || 0) + 1;
  const topFilesMap = new Map();
  for (const f of filteredFindings) topFilesMap.set(f.file, (topFilesMap.get(f.file) || 0) + 1);
  summary.topFiles = [...topFilesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, count]) => ({ file, count }));

  const report = {
    tool: 'design-enforcer',
    timestamp: new Date().toISOString(),
    strictMode: STRICT_MODE,
    isMainBranch: IS_MAIN,
    baselineMode: BASELINE_MODE,
    scannedRoots: roots.map((root) => path.relative(ROOT, root)),
    scannedFiles: files.length,
    counts: summary.counts,
    topFiles: summary.topFiles,
    findings: filteredFindings,
  };
  const out = writeReport(report);

  if (JSON_MODE) console.log(JSON.stringify(report));
  else if (!QUIET) {
    console.log('\nDesign Enforcer Summary');
    console.log(`CRITICAL: ${summary.counts.CRITICAL}  STRICT: ${summary.counts.STRICT}  REPORT: ${summary.counts.REPORT}`);
    console.log(`Scanned production/shared files: ${files.length}`);
    if (summary.topFiles.length) {
      console.log('Top files needing attention:');
      for (const t of summary.topFiles) console.log(` - ${t.file} (${t.count})`);
    }
    console.log(`Report: ${path.relative(ROOT, out)}`);
  }

  const shouldBlockStrict = BASELINE_MODE ? false : (STRICT_MODE || IS_MAIN);
  const shouldFail = summary.counts.CRITICAL > 0 || (shouldBlockStrict && summary.counts.STRICT > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();
