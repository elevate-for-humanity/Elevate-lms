#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['apps/marketing/app', 'components/site'];
const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx']);
const BLOCKED = [
  { pattern: /SOC\s*2\s*(Certified|Compliant)/i, label: 'SOC 2 certification/compliance without evidence gating' },
  { pattern: /99\.9%\s*(uptime|availability)/i, label: '99.9% uptime/availability without measured SLA evidence' },
  { pattern: /\b10x\s+(faster|productivity|development)/i, label: '10x productivity claim without benchmark evidence' },
  { pattern: /\bunlimited\s+(storage|capacity|scale)/i, label: 'unlimited infrastructure capacity claim' },
  { pattern: /\b1M\+?\s+(records|users|requests)/i, label: 'million-scale capacity claim without load evidence' },
  { pattern: /\b1000\+?\s+concurrent/i, label: 'concurrency claim without load-test evidence' },
  { pattern: /minimal\s+technical\s+debt/i, label: 'technical-debt quality claim without audit evidence' },
  { pattern: /first[- ]mover\s+advantage/i, label: 'market-position claim without competitive evidence' },
];

function extension(path) {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot);
}

function filesUnder(root) {
  const out = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...filesUnder(path));
    else if (ALLOWED_EXT.has(extension(path))) out.push(path);
  }
  return out;
}

let failures = 0;
for (const root of ROOTS) {
  for (const file of filesUnder(root)) {
    const text = readFileSync(file, 'utf8');
    for (const rule of BLOCKED) {
      if (rule.pattern.test(text)) {
        console.error(`❌ ${file}: ${rule.label}`);
        failures += 1;
      }
    }
  }
}

const marketingLayout = readFileSync('apps/marketing/app/layout.tsx', 'utf8');
if (!marketingLayout.includes('<FirstPartyTraffic />')) {
  console.error('❌ Marketing layout does not mount first-party traffic collection.');
  failures += 1;
} else {
  console.log('✅ First-party traffic collection is mounted.');
}

const legalPageExists = ['apps/marketing/app/legal/page.tsx', 'apps/marketing/app/(marketing)/legal/page.tsx']
  .some((path) => {
    try { readFileSync(path, 'utf8'); return true; } catch { return false; }
  });
if (!legalPageExists) console.warn('⚠️ Legal index route not found at canonical locations; verify privacy-policy routing separately.');

if (failures) {
  console.error(`\n❌ Public claim gate failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log('\n✅ Public claim gate passed.');
