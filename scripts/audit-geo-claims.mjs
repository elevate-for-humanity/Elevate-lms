import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicRoots = [
  'apps/marketing/app',
  'components',
  'lib/programs',
  'data/programs',
];

const blockedClaims = [
  '500+ Employer Partners',
  '2,000+ Placements Annually',
  '85% 1-Year Retention',
  '$5M+ WIOA Funding Secured',
  '90%+ credential pass rate',
  'most eligible students pay nothing',
];

const blockedPatterns = [
  /guaranteed\s+(job|employment|placement)/i,
  /\$10,?000[^\n]{0,80}(tax credit|apprenticeship credit)/i,
];

const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx']);
const findings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!allowedExt.has(path.extname(entry.name))) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const claim of blockedClaims) {
      if (text.toLowerCase().includes(claim.toLowerCase())) {
        findings.push(`${path.relative(root, full)}: blocked public claim: ${claim}`);
      }
    }
    for (const pattern of blockedPatterns) {
      if (pattern.test(text)) findings.push(`${path.relative(root, full)}: blocked claim pattern: ${pattern}`);
    }
  }
}

for (const rel of publicRoots) walk(path.join(root, rel));

const retiredRoute = path.join(root, 'apps/marketing/app/contracts/workforce-mou/route.ts');
if (!fs.existsSync(retiredRoute)) {
  findings.push('Retired workforce MOU route must return 410 with X-Robots-Tag noindex.');
} else {
  const text = fs.readFileSync(retiredRoute, 'utf8');
  if (!text.includes('status: 410') || !text.includes("'X-Robots-Tag': 'noindex, nofollow, noarchive'")) {
    findings.push('Retired workforce MOU route is missing required 410/noindex controls.');
  }
}

if (findings.length) {
  console.error('AI/GEO claim integrity audit failed:');
  for (const finding of findings) console.error(` - ${finding}`);
  process.exit(1);
}

console.log('AI/GEO claim integrity audit passed.');
