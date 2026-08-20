#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  'apps/marketing/app',
  'components/site',
  'components/home',
  'components/marketing',
  'content/blog',
];
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
  { pattern: /\$0\s+with\s+(?:WIOA|WRG|funding)/i, label: 'zero-cost workforce funding guarantee' },
  { pattern: /(?:covers?|covered)\s+100%\s+of\s+(?:program\s+)?tuition/i, label: '100% tuition coverage guarantee' },
  { pattern: /100%\s+of\s+(?:program\s+)?tuition/i, label: '100% tuition coverage guarantee' },
  { pattern: /funding\s+available\s+nationwide/i, label: 'nationwide funding availability claim' },
  { pattern: /all\s+programs\s+(?:are\s+)?(?:approved|eligible).*ETPL/i, label: 'provider-wide ETPL claim; approval must be program-specific' },
  { pattern: /all\s+programs\s+(?:are\s+)?(?:WIOA|WRG|workforce)[-\s]*(?:approved|eligible|funded)/i, label: 'provider-wide workforce funding claim; approval must be program-specific' },
];

function extension(path) {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot);
}

function filesUnder(root) {
  if (!existsSync(root)) {
    console.warn(`⚠️ Claim-scan root does not exist: ${root}`);
    return [];
  }
  const stat = statSync(root);
  if (stat.isFile()) return ALLOWED_EXT.has(extension(root)) ? [root] : [];

  const out = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const child = statSync(path);
    if (child.isDirectory()) out.push(...filesUnder(path));
    else if (ALLOWED_EXT.has(extension(path))) out.push(path);
  }
  return out;
}

let failures = 0;
let scanned = 0;
for (const root of ROOTS) {
  for (const file of filesUnder(root)) {
    scanned += 1;
    const text = readFileSync(file, 'utf8');
    for (const rule of BLOCKED) {
      if (rule.pattern.test(text)) {
        console.error(`❌ ${file}: ${rule.label}`);
        failures += 1;
      }
    }
  }
}

const requiredFiles = [
  'apps/marketing/app/layout.tsx',
  'scripts/check-dev-studio-claims.mjs',
  'supabase/migrations/20260818221500_dev_studio_claim_evidence_and_benchmarks.sql',
  'lib/programs/funding-registry.ts',
  'lib/programs/public-funding-copy.ts',
  'supabase/migrations/20260820023000_program_regulatory_claim_controls.sql',
];
for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`❌ Required claim-governance file is missing: ${file}`);
    failures += 1;
  }
}

if (existsSync('apps/marketing/app/layout.tsx')) {
  const marketingLayout = readFileSync('apps/marketing/app/layout.tsx', 'utf8');
  if (!marketingLayout.includes('<FirstPartyTraffic />')) {
    console.error('❌ Marketing layout does not mount first-party traffic collection.');
    failures += 1;
  } else {
    console.log('✅ First-party traffic collection is mounted.');
  }
}

const legalPageExists = ['apps/marketing/app/legal/page.tsx', 'apps/marketing/app/(marketing)/legal/page.tsx']
  .some((path) => existsSync(path));
if (!legalPageExists) {
  console.warn('⚠️ Legal index route not found at canonical locations; verify privacy-policy routing separately.');
}

console.log(`Scanned ${scanned} public-facing source files.`);
if (failures) {
  console.error(`\n❌ Public claim gate failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log('\n✅ Public claim gate passed.');
