// scripts/verify-barber-course.ts
// Usage:
//   pnpm tsx scripts/verify-barber-course.ts

import fs from 'node:fs';

const filePath = 'lib/curriculum/blueprints/barber-apprenticeship.ts';
const content = fs.readFileSync(filePath, 'utf8');

const clipperLessons = new Set([
  'barber-lesson-23',
  'barber-lesson-24',
  'barber-lesson-27',
]);

const slugs = [
  'barber-lesson-22',
  'barber-lesson-23',
  'barber-lesson-24',
  'barber-lesson-25',
  'barber-lesson-27',
];

const universalChecks: Array<[string, RegExp[]]> = [
  ['pre-clean',            [/pre-clean/i, /pre clean/i]],
  ['contact time',         [/contact time/i, /dwell time/i]],
  ['single-use',           [/single-use/i, /single use/i]],
  ['porous items',         [/porous/i]],
  ['blood exposure',       [/blood exposure/i, /blood-contaminated/i, /bleeding/i]],
  ['stop conditions',      [/stop the service immediately/i, /stop.*immediately/i]],
  ['competency checks',    [/competencyChecks/i]],
  ['epa language',         [/epa-registered/i, /epa registered/i]],
  ['universal precautions',[/universal precaution/i, /universal precautions/i]],
];

const clipperChecks: Array<[string, RegExp[]]> = [
  ['clipper disinfectant', [/clipper disinfectant/i, /clipper spray/i, /blade.*disinfect/i]],
];

let allPass = true;

for (const slug of slugs) {
  const match = content.match(
    new RegExp(
      `slug:\\s*'${slug}'.*?(?=,\\s*\\{\\s*slug:\\s*'barber-lesson-|,\\s*\\{\\s*slug:\\s*'barber-module-)`,
      'is'
    )
  );

  if (!match) {
    console.log(`FAIL ${slug}: not found`);
    allPass = false;
    continue;
  }

  const block = match[0];
  const checks = [...universalChecks, ...(clipperLessons.has(slug) ? clipperChecks : [])];
  const failures: string[] = [];

  for (const [label, patterns] of checks) {
    const found = patterns.some((rx) => rx.test(block));
    if (!found) failures.push(label);
  }

  if (failures.length) {
    allPass = false;
    console.log(`FAIL ${slug}: missing ${failures.join(', ')}`);
  } else {
    console.log(`PASS ${slug}`);
  }
}

console.log(allPass ? '\nALL PASS' : '\nFAILURES REMAIN');
process.exit(allPass ? 0 : 1);
