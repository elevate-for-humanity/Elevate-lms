#!/usr/bin/env node
/**
 * CI guardrail: enforce self-service funnel policy across active Marketing routes.
 * Exit 1 in CI/strict mode when policy violations are found.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict') || process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const roots = [
  'apps/marketing/app/store',
  'apps/marketing/app/pricing',
  'apps/marketing/app/platform',
  'app/store',
  'app/pricing',
  'app/platform',
].map((p) => path.join(ROOT,p)).filter(fs.existsSync);

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (['node_modules','.next','.git'].includes(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name) && !/route\.(ts|js)$/.test(entry.name)) files.push(full);
  }
}
for (const root of roots) walk(root);

const findings = [];
for (const file of files) {
  const rel = path.relative(ROOT,file);
  const text = fs.readFileSync(file,'utf8');
  const exempt = /accessibility|contact|help|legal|policy|security/i.test(rel);
  if (!exempt && /href=["']tel:/i.test(text)) findings.push({rule:'tel-link',file:rel,message:'Phone-gate tel: link in self-service sales funnel'});
  if (/\/store\//.test(rel) && /Schedule\s+(a\s+)?Demo/i.test(text)) findings.push({rule:'schedule-demo',file:rel,message:'Schedule Demo CTA in Store funnel'});
  if (!exempt && /Request Access/i.test(text)) findings.push({rule:'request-access',file:rel,message:'Request Access CTA in self-service funnel'});
}

console.log(`Self-service policy audit: ${files.length} source file(s) scanned`);
if (!roots.length) {
  console.error('❌ No active store/pricing/platform roots found; coverage is invalid.');
  process.exit(1);
}
if (findings.length) {
  for (const f of findings) console.warn(`⚠️ ${f.rule}: ${f.file} — ${f.message}`);
  console.warn(`${findings.length} self-service policy violation(s) found.`);
  if (STRICT) process.exit(1);
  process.exit(0);
}
console.log('✅ Self-service policy checks passed.');
