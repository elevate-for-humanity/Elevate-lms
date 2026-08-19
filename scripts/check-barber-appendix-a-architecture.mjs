#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const mustExist = [
  'lib/compliance/appendix-a-standards.ts',
  'lib/apprenticeship/registered-program-contract.ts',
  'lib/compliance/rapids-config.ts',
  'lib/course-builder/credentials/indiana-barber.yaml',
  'public/images/barber/straight-razor-safety.svg',
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/apprentice/rti/page.tsx',
  'apps/lms/app/host-shop/dashboard/competencies/page.tsx',
  'apps/lms/app/host-shop/dashboard/wages/page.tsx',
  'apps/lms/app/api/host-shop/competencies/route.ts',
  'apps/lms/app/lms/courses/[courseId]/page.tsx',
  'apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/page.tsx',
  'supabase/migrations/20260819011335_barber_employer_wage_contract_enforcement.sql',
];

for (const file of mustExist) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required registered-program architecture file: ${file}`);
}

const appendixPath = path.join(root, 'lib/compliance/appendix-a-standards.ts');
if (fs.existsSync(appendixPath)) {
  const appendix = fs.readFileSync(appendixPath, 'utf8');
  const requiredPatterns = [
    [/rapidsCode:\s*'0030CB'/, 'RAPIDS code 0030CB'],
    [/competencyCount:\s*14/, '14 competencies'],
    [/relatedInstructionHours:\s*260/, '260 RTI hours'],
    [/apprenticeToMentorRatio:\s*'1:1'/, '1:1 mentor ratio'],
    [/probationaryHours:\s*500/, '500-hour probation'],
    [/startingHourlyRate:\s*8/, '$8 starting baseline rate'],
    [/completedCompetencies:\s*7,\s*hourlyRate:\s*9/, '$9 baseline milestone at 7 competencies'],
    [/completedCompetencies:\s*14,\s*hourlyRate:\s*9\.5/, '$9.50 baseline milestone at 14 competencies'],
  ];
  for (const [pattern, label] of requiredPatterns) {
    if (!pattern.test(appendix)) failures.push(`Appendix A source missing ${label}`);
  }
}

const contractPath = path.join(root, 'lib/apprenticeship/registered-program-contract.ts');
if (fs.existsSync(contractPath)) {
  const contract = fs.readFileSync(contractPath, 'utf8');
  for (const [pattern, label] of [
    [/apprenticeship_standard_versions/, 'active standard-version resolution'],
    [/rapids_employer_wage_schedules/, 'employer-specific RAPIDS wage schedules'],
    [/rapids_rti_providers/, 'dynamic RAPIDS RTI providers'],
    [/fixedOjlCompletionHours:\s*null/, 'competency-based OJL completion contract'],
    [/resolveApplicableWage/, 'central registered wage resolver'],
  ]) {
    if (!pattern.test(contract)) failures.push(`Canonical registered-program contract missing ${label}`);
  }
}

const forbiddenRoute = path.join(root, 'apps/lms/app/apprentice/course/page.tsx');
if (fs.existsSync(forbiddenRoute)) failures.push('Duplicate /apprentice/course implementation must not exist');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const runtimeRoots = ['apps', 'components', 'lib'].map((dir) => path.join(root, dir));
const runtimeFiles = runtimeRoots.flatMap((dir) => walk(dir));
const allowedAppendixImports = new Set([
  path.normalize(path.join(root, 'lib/apprenticeship/registered-program-contract.ts')),
  path.normalize(path.join(root, 'lib/compliance/appendix-a-standards.ts')),
]);
const adminOperationalPrefixes = [
  path.normalize(path.join(root, 'apps/admin/')),
];

for (const full of runtimeFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  const normalized = path.normalize(full);
  const text = fs.readFileSync(full, 'utf8');

  if (
    !allowedAppendixImports.has(normalized) &&
    /from\s+['"]@\/lib\/compliance\/appendix-a-standards['"]/.test(text)
  ) {
    failures.push(`${rel}: direct Appendix A import bypasses registered-program-contract`);
  }

  if (/RAPIDS_CONFIG\.programs\.barber\.totalHours|barberConfig\.totalHours|RAPIDS\.totalHours/.test(text)) {
    failures.push(`${rel}: obsolete fixed Barber totalHours contract`);
  }

  if (/barber-0030cb-2025-07-10/.test(text) && rel !== 'lib/apprenticeship/registered-program-contract.ts') {
    failures.push(`${rel}: hard-coded Barber standard version key; resolve it through registered-program-contract`);
  }

  if (/rtiProvider\s*:|\.rtiProvider\b/.test(text) && rel !== 'lib/compliance/appendix-a-standards.ts') {
    failures.push(`${rel}: single hard-coded RTI provider contract is forbidden; use operational RAPIDS provider records`);
  }

  const readsOperationalWage = /\.from\(['"]rapids_employer_wage_schedules['"]\)/.test(text);
  const readsOperationalProviders = /\.from\(['"]rapids_rti_providers['"]\)/.test(text);
  const isContract = rel === 'lib/apprenticeship/registered-program-contract.ts';
  const isAdmin = adminOperationalPrefixes.some((prefix) => normalized.startsWith(prefix));
  if ((readsOperationalWage || readsOperationalProviders) && !isContract && !isAdmin) {
    failures.push(`${rel}: operational RAPIDS data bypasses registered-program-contract`);
  }

  for (const [pattern, label] of [
    [/144\s+RTI\s+hours?/i, 'legacy 144-hour RTI claim'],
    [/2,?000\s+(approved\s+)?OJL\s+hours?/i, 'legacy 2,000-hour registered Barber completion claim'],
    [/\/apprentice\/course(?:['"?]|$)/, 'duplicate apprentice course route'],
    [/vendor_name\s*[:=]\s*['"]milady['"]/i, 'Milady as canonical RTI vendor'],
  ]) {
    if (pattern.test(text)) failures.push(`${rel}: ${label}`);
  }
}

const criticalConsumers = [
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/apprentice/rti/page.tsx',
  'apps/lms/app/apprentice/handbook/page.tsx',
  'apps/lms/app/api/apprentice/appendix-a-progress/route.ts',
  'apps/lms/app/api/apprentice/hours-summary/route.ts',
  'apps/lms/app/api/learner/apprenticeship/route.ts',
  'apps/lms/app/api/host-shop/competencies/route.ts',
  'apps/lms/app/host-shop/orientation/page.tsx',
  'apps/lms/app/host-shop/dashboard/wages/page.tsx',
  'apps/lms/app/lms/courses/[courseId]/page.tsx',
  'lib/partner/board.ts',
  'lib/course-builder/templates/host-shop-apprenticeship-orientation.ts',
];
for (const rel of criticalConsumers) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  if (!/registered-program-contract/.test(text)) {
    failures.push(`${rel}: critical apprenticeship surface is not bound to registered-program-contract`);
  }
}

const staleHostShopRoute = '/host-shop/dashboard/board';
for (const full of runtimeFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  if (fs.readFileSync(full, 'utf8').includes(staleHostShopRoute)) {
    failures.push(`${rel}: stale Host Shop board alias must use /host-shop/dashboard`);
  }
}

const manifest = path.join(root, 'public/manifest-apprentice.json');
if (fs.existsSync(manifest) && fs.readFileSync(manifest, 'utf8').includes('/apprentice/course')) {
  failures.push('Apprentice PWA manifest still references duplicate /apprentice/course route');
}

const migrationDir = path.join(root, 'supabase/migrations');
const migrationFiles = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort()
  : [];
for (let i = 1; i < migrationFiles.length; i += 1) {
  const prev = migrationFiles[i - 1].match(/^(\d+)/)?.[1];
  const curr = migrationFiles[i].match(/^(\d+)/)?.[1];
  if (prev && curr && curr < prev) failures.push(`Migration chronology regression: ${migrationFiles[i - 1]} -> ${migrationFiles[i]}`);
}

if (failures.length) {
  console.error('Registered Barber architecture gate FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Registered Barber architecture gate passed');
console.log('Canonical boundary: Appendix A standard + Supabase operational RAPIDS state -> registered-program-contract');
