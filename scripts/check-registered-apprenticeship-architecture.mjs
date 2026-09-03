#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const requiredFiles = [
  'lib/compliance/appendix-a-standards.ts',
  'lib/apprenticeship/registered-program-contract.ts',
  'lib/apprenticeship/runtime-context.ts',
  'lib/apprenticeship/progress-service.ts',
  'lib/compliance/rapids-export.ts',
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/apprentice/rti/page.tsx',
  'apps/lms/app/host-shop/dashboard/HostShopDashboardView.tsx',
  'apps/lms/app/host-shop/dashboard/competencies/page.tsx',
  'apps/lms/app/host-shop/dashboard/wages/page.tsx',
  'apps/lms/app/api/host-shop/competencies/route.ts',
  'apps/lms/app/host-shop/orientation/page.tsx',
  'lib/course-builder/templates/host-shop-apprenticeship-orientation.ts',
];
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing required file: ${rel}`);
}

const appendixPath = path.join(root, 'lib/compliance/appendix-a-standards.ts');
if (fs.existsSync(appendixPath)) {
  const appendix = fs.readFileSync(appendixPath, 'utf8');
  for (const [pattern, label] of [
    [/rapidsCode:\s*'0030CB'/, 'Barber RAPIDS 0030CB'],
    [/competencyCount:\s*14/, 'Barber 14 competencies'],
    [/relatedInstructionHours:\s*260/, 'Barber 260 RTI hours'],
    [/rapidsCode:\s*'2089CB'/, 'Esthetician RAPIDS 2089CB'],
    [/competencyCount:\s*20/, 'Esthetician 20 competencies'],
    [/relatedInstructionHours:\s*300/, 'Esthetician 300 RTI hours'],
    [/rapidsCode:\s*'2090CB'/, 'Manicurist RAPIDS 2090CB'],
    [/competencyCount:\s*19/, 'Manicurist 19 competencies'],
    [/relatedInstructionHours:\s*210/, 'Manicurist 210 RTI hours'],
    [/apprenticeToMentorRatio:\s*'1:1'/, 'registered mentor ratio'],
  ]) {
    if (!pattern.test(appendix)) failures.push(`Appendix A source missing ${label}`);
  }
}

const contractPath = path.join(root, 'lib/apprenticeship/registered-program-contract.ts');
if (fs.existsSync(contractPath)) {
  const contract = fs.readFileSync(contractPath, 'utf8');
  for (const [pattern, label] of [
    [/apprenticeship_standard_versions/, 'active standard version resolution'],
    [/rapids_employer_wage_schedules/, 'employer RAPIDS wage resolution'],
    [/rapids_rti_providers/, 'dynamic RTI provider resolution'],
    [/fixedOjlCompletionHours:\s*null/, 'competency-based no-fixed-OJL contract'],
    [/canonicalProgramSlug/, 'occupation alias canonicalization'],
    [/resolveApplicableWage/, 'central wage resolver'],
  ]) {
    if (!pattern.test(contract)) failures.push(`Registered-program contract missing ${label}`);
  }
}

for (const [rel, patterns] of Object.entries({
  'lib/apprenticeship/runtime-context.ts': [/resolveRegisteredProgramContract/, /apprentice_placements/, /supervisor_user_id/],
  'lib/apprenticeship/progress-service.ts': [/apprentice_competency_records/, /apprenticeship_rti_entries/, /hour_entries/, /completionReady/],
  'lib/compliance/rapids-export.ts': [/resolveApprenticeshipRuntimeContext/, /loadRegisteredApprenticeshipProgress/, /resolveApplicableWage/],
})) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  for (const pattern of patterns) if (!pattern.test(text)) failures.push(`${rel}: missing canonical dependency ${pattern}`);
}

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

const runtimeFiles = ['apps', 'components', 'lib'].flatMap((dir) => walk(path.join(root, dir)));
const allowedAppendixImport = path.normalize(path.join(root, 'lib/apprenticeship/registered-program-contract.ts'));
for (const full of runtimeFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  const normalized = path.normalize(full);
  const text = fs.readFileSync(full, 'utf8');

  if (normalized !== allowedAppendixImport && /from\s+['"]@\/lib\/compliance\/appendix-a-standards['"]/.test(text)) {
    failures.push(`${rel}: direct Appendix A import bypasses registered-program-contract`);
  }
  if (/\/apprentice\/course(?:['"?]|$)/.test(text)) failures.push(`${rel}: duplicate apprentice course route reference`);
  if (/RAPIDS_CONFIG\.programs\./.test(text) && rel !== 'lib/compliance/rapids-config.ts') {
    failures.push(`${rel}: runtime reads legacy RAPIDS_CONFIG program facts`);
  }
  if (/rti_hours_required\s*\|\|\s*(144|500)/.test(text)) failures.push(`${rel}: fabricated RTI fallback`);
  if (/ojt_hours_required\s*\|\|\s*2000/.test(text)) failures.push(`${rel}: fabricated OJL fallback`);
  if (/programSlug=["']barber-apprenticeship["'].*isHostShop/.test(text)) failures.push(`${rel}: Host Shop competency surface is hard-coded to Barber`);
  if (/from\(['"]ojt_hours['"]\)/.test(text)) failures.push(`${rel}: legacy ojt_hours table bypasses canonical hour_entries ledger`);
}

const forbiddenFiles = [
  'apps/lms/app/apprentice/course/page.tsx',
  'components/dashboard/DOLCompetencyTracker.tsx',
];
for (const rel of forbiddenFiles) {
  if (fs.existsSync(path.join(root, rel))) failures.push(`Legacy executable must be removed: ${rel}`);
}

const adminHostShop = path.join(root, 'apps/admin/app/host-shop/dashboard/page.tsx');
if (fs.existsSync(adminHostShop)) {
  const text = fs.readFileSync(adminHostShop, 'utf8');
  if (!/getLmsUrl/.test(text) || !/\/host-shop\/dashboard/.test(text) || /ojt_hours_required|DOLCompetencyTracker/.test(text)) {
    failures.push('Admin Host Shop route must be a thin redirect to the canonical LMS Host Shop portal');
  }
}

const rapidsExport = path.join(root, 'lib/compliance/rapids-export.ts');
if (fs.existsSync(rapidsExport)) {
  const text = fs.readFileSync(rapidsExport, 'utf8');
  for (const [pattern, label] of [
    [/\|\|\s*144/, '144-hour RTI fallback'],
    [/\|\|\s*2000/, '2,000-hour OJL fallback'],
    [/8888 Keystone Crossing/, 'generic employer address fallback'],
    [/RAPIDS_CONFIG/, 'legacy RAPIDS_CONFIG export contract'],
  ]) if (pattern.test(text)) failures.push(`RAPIDS exporter still contains ${label}`);
}

const criticalConsumers = [
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/apprentice/rti/page.tsx',
  'apps/lms/app/api/host-shop/competencies/route.ts',
  'apps/lms/app/host-shop/orientation/page.tsx',
  'apps/lms/app/host-shop/dashboard/wages/page.tsx',
  'lib/partner/board.ts',
  'lib/course-builder/templates/host-shop-apprenticeship-orientation.ts',
];
for (const rel of criticalConsumers) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  if (!/(registered-program-contract|runtime-context|progress-service)/.test(text)) {
    failures.push(`${rel}: critical apprenticeship consumer bypasses canonical apprenticeship services`);
  }
}

if (failures.length) {
  console.error('Registered apprenticeship architecture gate FAILED');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Registered apprenticeship architecture gate passed');
console.log('Canonical boundary: Appendix A -> registered-program-contract -> runtime-context/progress-service -> portals/RAPIDS');
