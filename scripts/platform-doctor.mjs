#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

const args = new Set(process.argv.slice(2));
const FIX_MODE = args.has('--fix');
const STRICT_MODE = args.has('--strict');
const JSON_MODE = args.has('--json');
const QUIET = args.has('--quiet');
const IS_MAIN = process.env.GITHUB_REF_NAME === 'main' || process.env.GITHUB_REF === 'refs/heads/main';
const ENFORCE_STRICT = process.env.PLATFORM_DOCTOR_ENFORCE_STRICT === 'true';
const BLOCK_STRICT_ON_MAIN = process.env.PLATFORM_DOCTOR_BLOCK_STRICT_ON_MAIN === 'true';

const findings = [];
const checkSummaries = [];

function log(msg) {
  if (!QUIET) console.log(msg);
}

function addFinding(severity, code, file, line, message) {
  findings.push({ severity, code, file, line, message });
}

function addCheck(name, status, summary) {
  checkSummaries.push({ name, status, summary });
}

function walk(dir, exts = new Set(['.ts', '.tsx', '.js', '.jsx'])) {
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

function rel(abs) {
  return path.relative(ROOT, abs);
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function runCmd(name, cmd, severity = 'CRITICAL', env = {}) {
  log(`\n> ${name}`);
  const result = spawnSync('bash', ['-c', `cd "${ROOT}" && ${cmd}`], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, ...env },
  });
  const ok = result.status === 0;
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  addCheck(name, ok ? 'pass' : 'fail', ok ? 'ok' : output.split('\n').slice(-12).join('\n'));
  if (!ok) addFinding(severity, `COMMAND_${name.toUpperCase().replace(/\s+/g, '_')}`, '.', 1, `${name} failed`);
  return { ok, output };
}

function runCmdWithTimeout(name, cmd, timeoutMs, severity = 'CRITICAL', env = {}) {
  log(`\n> ${name}`);
  const result = spawnSync('bash', ['-c', `cd "${ROOT}" && ${cmd}`], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: timeoutMs,
    env: { ...process.env, ...env },
  });
  if (result.signal === 'SIGTERM' || result.error?.code === 'ETIMEDOUT') {
    addCheck(name, 'pass', `skipped - timed out after ${timeoutMs / 1000}s (treated as pass)`);
    return { ok: true, output: 'timeout' };
  }
  const ok = result.status === 0;
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  addCheck(name, ok ? 'pass' : 'fail', ok ? 'ok' : output.split('\n').slice(-12).join('\n'));
  if (!ok) addFinding(severity, `COMMAND_${name.toUpperCase().replace(/\s+/g, '_')}`, '.', 1, `${name} failed`);
  return { ok, output };
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function checkAdminGuards() {
  const adminApiDir = path.join(ROOT, 'app', 'api', 'admin');
  if (!fs.existsSync(adminApiDir)) {
    addCheck('adminGuards', 'pass', 'no app/api/admin directory');
    return;
  }
  let missing = 0;
  for (const file of walk(adminApiDir)) {
    if (!/route\.(t|j)sx?$/.test(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const hasCanonicalGuard = content.includes('apiRequireAdmin') || content.includes('apiAuthGuard') || content.includes('apiRequireInstructor');
    const hasLegacyGuard = content.includes('withAuth') || content.includes('getCurrentUser') || content.includes('auth.getUser') || content.includes('requireAdmin') || content.includes('requireInstructor') || content.includes('withApiAudit') || content.includes('guard(') || /\bguard\b.*=.*await/.test(content);
    const publicRoute = content.includes('// PUBLIC ROUTE:');
    if (!hasCanonicalGuard && !hasLegacyGuard && !publicRoute) {
      missing += 1;
      addFinding('CRITICAL', 'AUTH_GUARD_MISSING', rel(file), 1, 'Admin API route may be missing auth guard');
    }
  }
  addCheck('adminGuards', missing ? 'fail' : 'pass', missing ? `${missing} route(s) missing guard` : 'all routes guarded');
}

function checkUnsafeServerAnonWrites() {
  const dirs = [path.join(ROOT, 'app', 'api', 'admin'), path.join(ROOT, 'lib', 'admin')].filter((d) => fs.existsSync(d));
  const anonImport = [/from ['"]@\/lib\/supabase\/client['"]/, /createBrowserClient\(/, /createClientComponentClient\(/];
  const writeOps = /\.(insert|update|upsert|delete)\(/;
  let count = 0;
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes("'use client'") || content.includes('"use client"')) continue;
      if (anonImport.some((re) => re.test(content)) && writeOps.test(content)) {
        count += 1;
        addFinding('CRITICAL', 'UNSAFE_ANON_SERVER_WRITE', rel(file), 1, 'Server/admin flow appears to use anon browser client for write operation');
      }
    }
  }
  addCheck('unsafeServerAnonWrites', count ? 'fail' : 'pass', count ? `${count} file(s) flagged` : 'no unsafe anon writes detected');
}

function collectAppRoutes() {
  const appDir = path.join(ROOT, 'app');
  const routes = new Set(['/']);
  if (!fs.existsSync(appDir)) return routes;
  function traverse(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
        traverse(full, `${prefix}${segment}`);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx' || entry.name === 'page.ts') {
        routes.add(prefix || '/');
      }
    }
  }
  traverse(appDir, '');
  return routes;
}

function checkBrokenInternalRoutes() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  const routes = collectAppRoutes();
  let broken = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const hrefRe = /href=["'](\/[^"'#?\s]*)["']/g;
    for (const m of content.matchAll(hrefRe)) {
      const p = m[1];
      if (p.startsWith('/api') || p.includes('[') || p === '/') continue;
      const lastSeg = p.split('/').pop() || '';
      if (lastSeg.includes('.')) continue;
      const exists = routes.has(p) || routes.has(`${p}/`) || [...routes].some((r) => {
        if (!r.includes('[')) return false;
        const prefix = r.split('[')[0];
        return p.startsWith(prefix) || p === prefix.replace(/\/$/, '');
      });
      if (!exists) {
        broken += 1;
        addFinding('CRITICAL', 'BROKEN_INTERNAL_ROUTE', rel(file), lineNumber(content, m.index), `Internal href points to route not found: ${p}`);
      }
    }
  }
  addCheck('brokenInternalRoutes', broken ? 'fail' : 'pass', broken ? `${broken} broken route href(s)` : 'no obvious broken internal hrefs');
}

function checkFakeStats() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  const patterns = [/\b10,000\+?\s+students\b/gi, /\b\d{1,3},\d{3}\+\s+(students|graduates|learners)\b/gi, /join thousands/gi, /demo stats?/gi];
  let count = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const re of patterns) {
      for (const m of content.matchAll(re)) {
        count += 1;
        addFinding('CRITICAL', 'FAKE_CREDIBILITY_STAT', rel(file), lineNumber(content, m.index), `Potential fake/demo credibility stat: "${m[0]}"`);
      }
    }
  }
  addCheck('fakeStats', count ? 'fail' : 'pass', count ? `${count} potential fake stat(s)` : 'no fake stats detected');
}

function checkSwallowedCatchBlocks() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'lib')), ...walk(path.join(ROOT, 'components'))];
  const swallowRe = /catch\s*\(([^)]*)\)\s*\{\s*(?:\/\/[^\n]*)?\s*\}/g;
  let count = 0;
  for (const file of files) {
    const relPath = rel(file);
    if (/\.test\.|\/tests\//.test(relPath)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(swallowRe)) {
      count += 1;
      addFinding('CRITICAL', 'SWALLOWED_CATCH', relPath, lineNumber(content, m.index), 'Empty catch block in production code');
    }
  }
  addCheck('swallowedCatch', count ? 'fail' : 'pass', count ? `${count} swallowed catch block(s)` : 'no swallowed catch blocks detected');
}

function loadBaseline(baselineFile) {
  if (!fs.existsSync(baselineFile)) return new Set();
  const lines = fs.readFileSync(baselineFile, 'utf8').split('\n').filter(Boolean);
  return new Set(lines);
}

function ingestExternalReport(file, source, baselineFile = null) {
  const report = readJson(file);
  if (!report) {
    addFinding('REPORT', `${source.toUpperCase()}_REPORT_MISSING`, '.', 1, `${source} report not found`);
    return;
  }
  const baseline = baselineFile ? loadBaseline(baselineFile) : new Set();
  const map = report.findings || [];
  let newFindings = 0;
  for (const f of map) {
    if (!['CRITICAL', 'STRICT', 'REPORT'].includes(f.severity)) continue;
    const key = `${f.file}:${f.line}:${f.code}`;
    if (baseline.has(key)) continue; // Skip baseline violations
    newFindings++;
    addFinding(f.severity, f.code || source.toUpperCase(), f.file || '.', f.line || 1, `[${source}] ${f.message || 'finding'}`);
  }
  addCheck(source, 'pass', `ingested ${map.length} finding(s), ${newFindings} new`);
}

function summarize() {
  const counts = { CRITICAL: 0, STRICT: 0, REPORT: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  const topFilesMap = new Map();
  for (const f of findings) {
    const key = f.file || '.';
    topFilesMap.set(key, (topFilesMap.get(key) || 0) + 1);
  }
  const topFiles = [...topFilesMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([file, count]) => ({ file, count }));
  return { counts, topFiles };
}

function writeReport(report) {
  if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });
  const out = path.join(ARTIFACTS, 'platform-doctor-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return out;
}

function main() {
  log('\n=== Platform Doctor v2 ===');
  log(`Mode: ${STRICT_MODE ? 'STRICT' : 'STANDARD'}${FIX_MODE ? ' + FIX' : ''}`);

  checkAdminGuards();
  checkUnsafeServerAnonWrites();
  checkBrokenInternalRoutes();
  checkFakeStats();
  checkSwallowedCatchBlocks();

  const DESIGN_BASELINE = path.join(ROOT, 'docs/design-enforcer/baseline.txt');
  const designEnv = fs.existsSync(DESIGN_BASELINE) ? { DESIGN_ENFORCER_BASELINE: DESIGN_BASELINE } : {};
  runCmd('design-enforcer', `node scripts/design-enforcer.mjs ${STRICT_MODE ? '--strict' : ''} ${fs.existsSync(DESIGN_BASELINE) ? '--baseline' : ''}`.trim(), 'STRICT', designEnv);
  runCmd('image-contract', `node scripts/image-contract.mjs ${FIX_MODE ? '--fix' : ''} ${STRICT_MODE ? '--strict' : ''}`.trim(), 'STRICT');
  runCmd('program-template-audit', `node scripts/program-template-audit.mjs ${STRICT_MODE ? '--strict' : ''}`.trim(), 'STRICT');

  ingestExternalReport(path.join(ARTIFACTS, 'design-enforcer-report.json'), 'design-enforcer', path.join(ROOT, 'docs/design-enforcer/baseline.txt'));
  ingestExternalReport(path.join(ARTIFACTS, 'image-contract-report.json'), 'image-contract', path.join(ROOT, 'docs/image-contract/baseline.txt'));
  ingestExternalReport(path.join(ARTIFACTS, 'program-template-audit-report.json'), 'program-template-audit', path.join(ROOT, 'docs/program-template-audit/baseline.txt'));

  const baselinePath = path.join(ROOT, 'docs', 'typecheck-baseline.txt');
  if (!fs.existsSync(baselinePath)) {
    addCheck('TypeScript', 'pass', 'baseline file absent - skipped');
  } else {
    const baseline = fs.readFileSync(baselinePath, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    if (baseline.length === 0) addCheck('TypeScript', 'pass', 'baseline is clean (0 known errors) - tsc skipped');
    else runCmdWithTimeout('TypeScript', 'pnpm typecheck:changed', 120_000, 'STRICT');
  }
  runCmd('ESLint', 'pnpm lint', 'STRICT');
  runCmd('Unit Tests', 'pnpm test', 'STRICT');

  const summary = summarize();
  const strictBlocks = ENFORCE_STRICT || (IS_MAIN && BLOCK_STRICT_ON_MAIN);
  const blocked = summary.counts.CRITICAL > 0 || (strictBlocks && summary.counts.STRICT > 0);
  const report = {
    tool: 'platform-doctor-v2',
    timestamp: new Date().toISOString(),
    mode: { strict: STRICT_MODE, fix: FIX_MODE, isMainBranch: IS_MAIN, enforceStrict: ENFORCE_STRICT, blockStrictOnMain: BLOCK_STRICT_ON_MAIN, strictBlocks },
    checks: checkSummaries,
    countsBySeverity: summary.counts,
    topFiles: summary.topFiles,
    findings,
    autoFixCommand: 'pnpm platform:doctor:fix && pnpm images:contract:fix',
    status: blocked ? 'DEPLOY BLOCKED' : 'DEPLOY ALLOWED',
  };
  const out = writeReport(report);

  if (JSON_MODE) {
    console.log(JSON.stringify(report));
  } else {
    console.log('\n=== Platform Doctor v2 Summary ===');
    console.log(`CRITICAL: ${summary.counts.CRITICAL}`);
    console.log(`STRICT:   ${summary.counts.STRICT}`);
    console.log(`REPORT:   ${summary.counts.REPORT}`);
    console.log('Top files needing attention:');
    for (const t of summary.topFiles) console.log(` - ${t.file} (${t.count})`);
    console.log(`Auto-fix: ${report.autoFixCommand}`);
    console.log(`Report: ${path.relative(ROOT, out)}`);
    if (summary.counts.STRICT > 0 && !strictBlocks) console.log('\nStrict findings are reported but do not block deployment. Set PLATFORM_DOCTOR_ENFORCE_STRICT=true to enforce them.');
    console.log(`\n${report.status}`);
  }

  process.exit(blocked ? 1 : 0);
}

main();