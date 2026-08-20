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
  { pattern: /\bWIOA[-\s]*compliant\b/i, label: 'blanket WIOA-compliant claim; describe implemented controls and program evidence instead' },
  { pattern: /full\s+compliance\s+with\s+(?:the\s+)?Workforce\s+Innovation\s+and\s+Opportunity\s+Act/i, label: 'absolute WIOA compliance claim' },
  { pattern: /\bETPL[-\s]*(?:certified|approved)\b/i, label: 'blanket ETPL certification/approval wording; ETPL evidence is program-specific' },
  { pattern: /blockchain[-\s]*(?:verified|verification|anchored)|on[-\s]*chain\s+credential/i, label: 'blockchain credential claim without a production chain anchor' },
  { pattern: /\b100%\s+compliant\b/i, label: 'absolute compliance claim' },
  { pattern: /\$300K\s*[–-]\s*\$650K|\$300,000\s*[–-]\s*\$650,000/i, label: 'credential-value claim without published methodology' },
  { pattern: /\b4\s*[–-]\s*8\s+years?\s+saved\b/i, label: 'time-saved claim without published methodology' },
  { pattern: /\blaunch\s+in\s+30\s+days\b/i, label: 'unqualified implementation-time guarantee' },
  { pattern: /\bno\s+paperwork\b/i, label: 'absolute paperwork claim' },
  { pattern: /\b50\+\s+partner\s+organizations\b/i, label: 'partner-count claim without canonical evidence' },
  { pattern: /\bcredentials?\s+(?:are\s+)?issued\s+on[-\s]*site\b/i, label: 'credential issuance location claim without program-specific evidence' },
  { pattern: /\breal[-\s]*time\s+reporting\s+on\s+placement,?\s+retention,?\s+and\s+wages\b/i, label: 'real-time outcome reporting claim without a measured source contract' },
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
  'content/heroBanners.ts',
  'supabase/migrations/20260820023000_program_regulatory_claim_controls.sql',
  'supabase/migrations/20260820030000_claim_evidence_runtime_hardening.sql',
  'supabase/migrations/20260820031500_correct_program_regulatory_evidence.sql',
];
for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`❌ Required claim-governance file is missing: ${file}`);
    failures += 1;
  }
}

if (existsSync('content/heroBanners.ts')) {
  const heroRenderer = readFileSync('content/heroBanners.ts', 'utf8');
  const requiredHeroControls = [
    'sanitizePublicFundingText',
    'sanitizePublicFundingList',
    'sanitizeHeroText',
    'UNSUPPORTED_HERO_SENTENCE',
  ];
  for (const control of requiredHeroControls) {
    if (!heroRenderer.includes(control)) {
      console.error(`❌ Canonical hero renderer is missing claim control: ${control}`);
      failures += 1;
    }
  }
  if (!failures) console.log('✅ Canonical hero claim sanitizer is enforced.');
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
