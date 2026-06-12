#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

const args = new Set(process.argv.slice(2));
const BASELINE_MODE = args.has("--baseline");
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

  // 1) no custom program cards when shared ProgramCard exists
  // Exempt: components/ (these ARE the shared components), and files that use a prefixed name
  // Only flag exact "ProgramCard" — not "CatalogProgramCard", "ProgramProgressCard", etc.
  const isSharedComponentDir = /^components\//.test(rel);
  if (!isSharedComponentDir && /function\s+ProgramCard\b|const\s+ProgramCard\s*=/.test(content)) {
    const idx = content.search(/function\s+ProgramCard\b|const\s+ProgramCard\s*=/);
    addFinding('STRICT', 'CUSTOM_PROGRAM_CARD', rel, lineNumber(content, idx), 'Custom program card detected. Use shared components/programs/ProgramCard.tsx');
  }

  // 2) non-brand green tokens
  const greenRe = /\b(?:bg|text|border)-green-\d+\b/g;
  for (const m of content.matchAll(greenRe)) {
    addFinding('STRICT', 'NON_BRAND_GREEN', rel, lineNumber(content, m.index), `Use brand-green-* token instead of ${m[0]}`);
  }

  // 3) CheckCircle2 bullet prohibition
  const checkCircleRe = /<CheckCircle2\b/g;
  for (const m of content.matchAll(checkCircleRe)) {
    addFinding('STRICT', 'PROHIBITED_CHECKCIRCLE2', rel, lineNumber(content, m.index), 'CheckCircle2 used. Replace with brand dot bullet.');
  }

  // 4) Decorative GraduationCap/Award unless intentional accessibility marker present
  const decoRe = /<(GraduationCap|Award)\b/g;
  for (const m of content.matchAll(decoRe)) {
    const start = Math.max(0, m.index - 160);
    const end = Math.min(content.length, m.index + 240);
    const window = content.slice(start, end);
    if (!/aria-label=|title=|INTENTIONAL_ICON/.test(window)) {
      addFinding('STRICT', 'PROHIBITED_DECORATIVE_ICON', rel, lineNumber(content, m.index), `${m[1]} appears decorative without accessibility intent marker`);
    }
  }

  // 5) weak CTA copy — only flag when used as a button/link label, not in prose
  // Skip: lines containing design-ok, list items (•, -, *), prose sentences,
  //        type="submit" inputs, and lines where the word is mid-sentence.
  const weakCtas = [/\bLearn More\b/g, /\bClick Here\b/g, /\bSubmit\b/g, /\bExplore\b/g];
  const lines = content.split('\n');
  for (const re of weakCtas) {
    for (const m of content.matchAll(re)) {
      const lineIdx = lineNumber(content, m.index) - 1;
      const lineText = lines[lineIdx] ?? '';
      // Skip prose context: list bullets, sentences, type="submit", design-ok suppression, comments
      if (/design-ok/.test(lineText)) continue;
      if (/type=["']submit["']/.test(lineText)) continue;
      if (/^\s*[•\-\*]/.test(lineText)) continue; // list item
      if (/\bSubmitting\b|\bExploring\b|\bLearning\b/.test(lineText)) continue; // gerund prose
      if (/\/\/|\/\*|\*\/|\{\/\*/.test(lineText)) continue; // comment line
      // Only flag when the word appears as a JSX text node or string prop value
      const isButtonLabel =
        />[\s]*(?:Learn More|Click Here|Submit|Explore)[\s]*</.test(lineText) ||
        /(?:children|label|text|buttonText|cta)=["'](?:Learn More|Click Here|Submit|Explore)["']/.test(lineText) ||
        /\bbutton\b.*(?:Learn More|Click Here|Submit|Explore)|(?:Learn More|Click Here|Submit|Explore).*\bbutton\b/i.test(lineText);
      if (!isButtonLabel) continue;
      addFinding('STRICT', 'WEAK_CTA_COPY', rel, lineNumber(content, m.index), `Weak CTA copy found: "${m[0]}"`);
    }
  }

  // 6) dead href="#"
  const deadHrefRe = /href=["']#["']/g;
  for (const m of content.matchAll(deadHrefRe)) {
    addFinding('STRICT', 'DEAD_HREF', rel, lineNumber(content, m.index), 'Dead CTA/link href="#" detected');
  }

  // 7) solid bg-white with text-white on same element
  const classRe = /className=["'`][^"'`]*["'`]/g;
  for (const m of content.matchAll(classRe)) {
    if (/\bbg-white\b/.test(m[0]) && /\btext-white\b/.test(m[0])) {
      addFinding('STRICT', 'INVISIBLE_TEXT', rel, lineNumber(content, m.index), 'className contains bg-white and text-white on the same element');
    }
  }

  // 8) hero image/video without approved treatment
  if (/hero/i.test(rel) || /Hero/.test(content)) {
    if (/<video\b/.test(content) && !/useHeroVideo|HeroVideo/.test(content)) {
      const idx = content.search(/<video\b/);
      addFinding('STRICT', 'HERO_VIDEO_TREATMENT', rel, lineNumber(content, idx), 'Hero video should use approved HeroVideo/useHeroVideo treatment');
    }
    // Only flag dark/black overlays — brand-blue gradients are the approved treatment
    if (/<Image\b|<img\b/.test(content) && /from-black\/|from-gray-900|from-slate-900/.test(content)) {
      const idx = content.search(/from-black\/|from-gray-900|from-slate-900/);
      addFinding('STRICT', 'HERO_OVERLAY_TREATMENT', rel, lineNumber(content, idx), 'Hero media uses prohibited dark overlay. Use from-brand-blue-900/* instead.');
    }
  }

  // 9) inconsistent max-width/container patterns
  // Exempt: calc(), vw/vh units (responsive utilities), and fraction/percentage values
  const maxWRe = /\bmax-w-\[[^\]]+\]|\bmax-w-(8xl|9xl|10xl)\b/g;
  for (const m of content.matchAll(maxWRe)) {
    const val = m[0];
    // Skip responsive/calc values — these are intentional layout utilities
    if (/calc\(|vw|vh|%|\//.test(val)) continue;
    addFinding('STRICT', 'INCONSISTENT_CONTAINER', rel, lineNumber(content, m.index), `Non-standard max-width pattern ${val} detected`);
  }

  // REPORT-only opportunities
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

function summarize() {
  const counts = { CRITICAL: 0, STRICT: 0, REPORT: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  const topFilesMap = new Map();
  for (const f of findings) topFilesMap.set(f.file, (topFilesMap.get(f.file) || 0) + 1);
  const topFiles = [...topFilesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, count]) => ({ file, count }));
  return { counts, topFiles };
}

function writeReport(report) {
  if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });
  const out = path.join(ARTIFACTS, 'design-enforcer-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return out;
}

function main() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  for (const file of files) scanFile(file);

  // Load and apply baseline filtering
  let baselineSet = new Set();
  if (BASELINE_MODE && BASELINE_FILE) {
    try {
      baselineSet = new Set(fs.readFileSync(BASELINE_FILE, 'utf8').split('\n').filter(Boolean));
    } catch {}
  }
  const filteredFindings = BASELINE_MODE
    ? findings.filter(f => {
        const key = `${f.file}:${f.line}:${f.code}`;
        return !baselineSet.has(key);
      })
    : findings;

  const summary = {
    counts: { CRITICAL: 0, STRICT: 0, REPORT: 0 },
    topFiles: [],
  };
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
    counts: summary.counts,
    topFiles: summary.topFiles,
    findings: filteredFindings,
  };
  const out = writeReport(report);

  if (JSON_MODE) {
    console.log(JSON.stringify(report));
  } else if (!QUIET) {
    console.log('\nDesign Enforcer Summary');
    console.log(`CRITICAL: ${summary.counts.CRITICAL}  STRICT: ${summary.counts.STRICT}  REPORT: ${summary.counts.REPORT}`);
    if (summary.topFiles.length) {
      console.log('Top files needing attention:');
      for (const t of summary.topFiles) console.log(` - ${t.file} (${t.count})`);
    }
    console.log(`Report: ${path.relative(ROOT, out)}`);
  }

  // In baseline mode, only fail on CRITICAL or new STRICT violations
  // In non-baseline mode, fail on any STRICT violation in strict/main context
  const shouldBlockStrict = BASELINE_MODE ? false : (STRICT_MODE || IS_MAIN);
  const shouldFail = summary.counts.CRITICAL > 0 || (shouldBlockStrict && summary.counts.STRICT > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();
