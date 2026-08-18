#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const mustExist = [
  'lib/compliance/appendix-a-standards.ts',
  'lib/compliance/rapids-config.ts',
  'lib/course-builder/credentials/indiana-barber.yaml',
  'public/images/barber/straight-razor-safety.svg',
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/host-shop/dashboard/competencies/page.tsx',
  'apps/lms/app/api/host-shop/competencies/route.ts',
  'apps/lms/app/lms/courses/[courseId]/page.tsx',
  'apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/page.tsx',
  'supabase/migrations/20260818203000_barber_appendix_a_governance.sql',
  'supabase/migrations/20260818204000_barber_appendix_a_program_contract.sql',
  'supabase/migrations/20260818205000_barber_appendix_a_competency_crosswalk.sql',
];

for (const file of mustExist) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required Barber architecture file: ${file}`);
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
    [/startingHourlyRate:\s*8/, '$8 starting Appendix rate'],
    [/completedCompetencies:\s*7,\s*hourlyRate:\s*9/, '$9 milestone at 7 competencies'],
    [/completedCompetencies:\s*14,\s*hourlyRate:\s*9\.5/, '$9.50 milestone at 14 competencies'],
  ];
  for (const [pattern, label] of requiredPatterns) {
    if (!pattern.test(appendix)) failures.push(`Appendix A source missing ${label}`);
  }
}

const forbiddenRoute = path.join(root, 'apps/lms/app/apprentice/course/page.tsx');
if (fs.existsSync(forbiddenRoute)) failures.push('Duplicate /apprentice/course implementation must not exist');

const runtimeFiles = [
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/lms/courses/[courseId]/page.tsx',
  'lib/compliance/rapids-config.ts',
  'lib/programs/canonical-data.ts',
];
const banned = [
  [/144\s+RTI\s+hours?/i, 'legacy 144-hour RTI claim'],
  [/2,?000\s+(approved\s+)?OJL\s+hours?/i, 'legacy 2,000-hour DOL completion claim'],
  [/\/apprentice\/course(?:['"?]|$)/, 'duplicate apprentice course route'],
  [/vendor_name\s*[:=]\s*['"]milady['"]/i, 'Milady as canonical RTI vendor'],
];

for (const rel of runtimeFiles) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  for (const [pattern, label] of banned) {
    if (pattern.test(text)) failures.push(`${rel}: ${label}`);
  }
}

const manifest = path.join(root, 'public/manifest-apprentice.json');
if (fs.existsSync(manifest) && fs.readFileSync(manifest, 'utf8').includes('/apprentice/course')) {
  failures.push('Apprentice PWA manifest still references duplicate /apprentice/course route');
}

const migrationFiles = fs.readdirSync(path.join(root, 'supabase/migrations')).filter((name) => name.endsWith('.sql')).sort();
for (let i = 1; i < migrationFiles.length; i += 1) {
  const prev = migrationFiles[i - 1].match(/^(\d+)/)?.[1];
  const curr = migrationFiles[i].match(/^(\d+)/)?.[1];
  if (prev && curr && curr < prev) failures.push(`Migration chronology regression: ${migrationFiles[i - 1]} -> ${migrationFiles[i]}`);
}

if (failures.length) {
  console.error('Barber Appendix A architecture gate FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Barber Appendix A architecture gate passed');
console.log('Canonical contract: RAPIDS 0030CB · 14 competencies · 260 RTI · 1:1 mentor ratio · 500-hour probation');
