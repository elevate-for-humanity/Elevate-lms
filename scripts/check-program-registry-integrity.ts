#!/usr/bin/env tsx
import { PROGRAMS, PROGRAM_ALIASES } from '../lib/program-registry';
import { ALL_PROGRAMS } from '../lib/programs/static-registry';
import { isRAPIDSProgram } from '../lib/compliance/rapids-config';
import { isStrictWorkforceFundedProgram } from '../lib/programs/funding-registry';

const failures: string[] = [];

function duplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

for (const slug of duplicateValues(PROGRAMS.map((program) => program.slug))) {
  failures.push(`duplicate canonical intake slug: ${slug}`);
}

for (const slug of duplicateValues(ALL_PROGRAMS.map((program) => program.slug))) {
  failures.push(`duplicate normalized static slug: ${slug}`);
}

const canonicalSlugs = new Set(PROGRAMS.map((program) => program.slug));
for (const [alias, target] of Object.entries(PROGRAM_ALIASES)) {
  if (canonicalSlugs.has(alias)) failures.push(`compatibility alias is also a displayed canonical slug: ${alias}`);
  if (!canonicalSlugs.has(target)) failures.push(`compatibility alias target is missing: ${alias} -> ${target}`);
}

for (const program of PROGRAMS) {
  if (!isRAPIDSProgram(program.slug) && /\bregistered apprenticeship\b|\bdol[-\s]?registered\b/i.test(program.name)) {
    failures.push(`unverified federal apprenticeship wording in intake registry: ${program.slug} (${program.name})`);
  }
}

for (const program of ALL_PROGRAMS) {
  const fundingOptions = program.fundingOptions ?? [];
  const claimsWorkforceFunding = fundingOptions.includes('wioa') || fundingOptions.includes('wrg');
  if (claimsWorkforceFunding && !isStrictWorkforceFundedProgram(program.slug)) {
    failures.push(`unverified workforce funding label in public static registry: ${program.slug}`);
  }

  if (!isRAPIDSProgram(program.slug)) {
    const corpus = [
      program.title,
      program.subtitle,
      program.badge,
      program.metaTitle,
      program.metaDescription,
      ...(program.programDescription ?? []),
    ].filter(Boolean).join(' ');
    if (/\bdol[-\s]?registered\b|\bfederally registered apprenticeship\b|\brapids[-\s]?registered\b/i.test(corpus)) {
      failures.push(`unverified RAPIDS/DOL language in normalized public program: ${program.slug}`);
    }
  }
}

console.log(`Canonical intake programs: ${PROGRAMS.length}`);
console.log(`Normalized static programs: ${ALL_PROGRAMS.length}`);
console.log(`Compatibility aliases: ${Object.keys(PROGRAM_ALIASES).length}`);

if (failures.length) {
  console.error(`FAIL: program registry integrity found ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('PASS: program slugs are unique, aliases are non-display inputs, and public funding/RAPIDS labels match the verified registries.');
