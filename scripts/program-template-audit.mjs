#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

const args = new Set(process.argv.slice(2));
const STRICT_MODE = args.has('--strict');
const JSON_MODE = args.has('--json');
const QUIET = args.has('--quiet');
const IS_MAIN =
  process.env.GITHUB_REF_NAME === 'main' || process.env.GITHUB_REF === 'refs/heads/main';

const findings = [];

function addFinding(severity, code, file, message) {
  findings.push({ severity, code, file, message });
}

function getProgramPages() {
  const pages = [];
  const root = path.join(ROOT, 'apps', 'marketing', 'app', 'programs');
  if (!fs.existsSync(root)) return pages;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'page.tsx' || entry.name === 'page.jsx' || entry.name === 'page.ts')
        pages.push(full);
    }
  }
  walk(root);
  return pages;
}

function has(content, patterns) {
  return patterns.some((p) => p.test(content));
}

function isTopLevelProgramPage(rel) {
  return /^apps\/marketing\/app\/programs\/[^/]+\/page\.(tsx|jsx|ts)$/.test(rel);
}

function isExcludedTopLevelPage(rel) {
  return /^apps\/marketing\/app\/programs\/(admin|catalog|apprenticeships|federal-funded|micro-programs|jri|business|healthcare|skilled-trades|technology|beauty|cybersecurity|barber|page)\//.test(
    rel,
  );
}

function scan(file) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  if (!isTopLevelProgramPage(rel) || isExcludedTopLevelPage(rel)) {
    return;
  }

  const usesCanonicalTemplate = has(content, [
    /import\s+ProgramDetailPage\s+from\s+['"]@\/components\/programs\/ProgramDetailPage['"]/,
    /import\s+ProgramPageLayout\s+from\s+['"]@\/components\/programs\/ProgramPageLayout['"]/,
    /import\s+ProgramCategoryPage\s+from\s+['"]@\/components\/programs\/ProgramCategoryPage['"]/,
    // Data-driven program pages using the canonical program schema + structured data are also canonical
    /import\s+\{[^}]*ProgramStructuredData[^}]*\}\s+from\s+['"]@\/components\/seo\//,
    /import\s+\{?\s*validateProgram\s*\}?\s+from\s+['"]@\/lib\/programs\/program-schema['"]/,
    // Pages using PublicLandingPage (config-driven marketing template) are canonical
    /import\s+PublicLandingPage\s+from\s+['"]@\/components\/marketing\/PublicLandingPage['"]/,
    // Pages using the program data constants with FundingInfoBlock are canonical program pages
    /import\s+FundingInfoBlock\s+from\s+['"]@\/components\/programs\/FundingInfoBlock['"]/,
  ]);

  if (!usesCanonicalTemplate) {
    addFinding(
      'STRICT',
      'PROGRAM_TEMPLATE_NOT_CANONICAL',
      rel,
      'Top-level program page must use ProgramDetailPage, ProgramPageLayout, or ProgramCategoryPage',
    );
  } else {
    // Canonical template pages are schema-driven; skip heuristic section checks on these wrappers.
    return;
  }

  const required = [
    {
      code: 'SECTION_HERO',
      label: 'Hero',
      patterns: [/\bhero\b/i, /HeroVideo|ProgramHero|heroBanner/i],
    },
    {
      code: 'SECTION_WHO_FOR',
      label: 'Who this is for',
      patterns: [/who this is for/i, /who it helps/i, /ideal (for|candidate)/i],
    },
    {
      code: 'SECTION_WHAT_LEARN',
      label: "What you'll learn",
      patterns: [/what you(?:'|’)ll learn/i, /curriculum/i, /learning objectives?/i],
    },
    {
      code: 'SECTION_OUTCOMES',
      label: 'Career outcomes',
      patterns: [/career outcomes?/i, /career path/i, /job outcomes?/i, /employment outcomes?/i],
    },
    {
      code: 'SECTION_REQUIREMENTS',
      label: 'Requirements',
      patterns: [/requirements?/i, /prerequisites?/i, /eligibility/i],
    },
    {
      code: 'SECTION_ENROLLMENT_CTA',
      label: 'Enrollment CTA',
      patterns: [/Apply Now/i, /Start Enrollment/i, /Check Eligibility/i, /Talk to Admissions/i],
    },
    {
      code: 'SECTION_SUPPORT',
      label: 'FAQ or support/contact',
      patterns: [/\bFAQ\b/i, /support/i, /contact/i],
    },
  ];

  for (const req of required) {
    if (!has(content, req.patterns)) {
      addFinding('STRICT', req.code, rel, `Missing required section: ${req.label}`);
    }
  }

  const wioaApplicable =
    /WIOA|apprenticeship|workforce|career connect/i.test(content) ||
    /\/(wioa|apprenticeship|programs)\//i.test(rel);
  if (wioaApplicable) {
    if (!has(content, [/funding/i, /WIOA/i, /Indiana Career Connect/i])) {
      addFinding(
        'STRICT',
        'SECTION_FUNDING_WIOA',
        rel,
        'Missing Funding/WIOA/Indiana Career Connect block for applicable page',
      );
    }
  }

  const approvedCtas = ['Check Eligibility', 'Apply Now', 'Start Enrollment', 'Talk to Admissions'];
  const ctaMentions = [...content.matchAll(/>([^<]{2,60})</g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
  const potentialCtas = ctaMentions.filter((t) =>
    /apply|enroll|eligib|admission|start|learn|submit|contact|talk/i.test(t),
  );
  for (const cta of potentialCtas) {
    if (!approvedCtas.includes(cta) && /Learn More|Click Here|Submit|Explore/i.test(cta)) {
      addFinding('STRICT', 'CTA_NOT_APPROVED', rel, `CTA text not approved: "${cta}"`);
    }
  }

  const fakeStats = [
    /\b10,000\+?\s+students\b/i,
    /\b\d{1,3},\d{3}\+\s+(students|graduates|learners)\b/i,
  ];
  for (const re of fakeStats) {
    if (re.test(content)) {
      addFinding(
        'CRITICAL',
        'FAKE_CREDIBILITY_STAT',
        rel,
        'Hardcoded credibility/fake stat detected',
      );
      break;
    }
  }

  if (/transform your future/i.test(content)) {
    addFinding(
      'STRICT',
      'GENERIC_FILLER_COPY',
      rel,
      'Generic filler copy detected: "transform your future"',
    );
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
  const out = path.join(ARTIFACTS, 'program-template-audit-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return out;
}

function main() {
  const files = getProgramPages();
  for (const file of files) scan(file);

  const summary = summarize();
  const report = {
    tool: 'program-template-audit',
    timestamp: new Date().toISOString(),
    strictMode: STRICT_MODE,
    isMainBranch: IS_MAIN,
    scannedFiles: files.length,
    counts: summary.counts,
    topFiles: summary.topFiles,
    findings,
  };
  const out = writeReport(report);

  if (JSON_MODE) {
    console.log(JSON.stringify(report));
  } else if (!QUIET) {
    console.log('\nProgram Template Audit Summary');
    console.log(`Scanned: ${files.length}`);
    console.log(
      `CRITICAL: ${summary.counts.CRITICAL}  STRICT: ${summary.counts.STRICT}  REPORT: ${summary.counts.REPORT}`,
    );
    console.log(`Report: ${path.relative(ROOT, out)}`);
  }

  const shouldBlockStrict = STRICT_MODE || IS_MAIN;
  const shouldFail =
    summary.counts.CRITICAL > 0 || (shouldBlockStrict && summary.counts.STRICT > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();
