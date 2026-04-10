/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { barberCourseSeed } from './seeds/barber-course.seed';

const blueprintPath = path.resolve(process.cwd(), 'lib/curriculum/blueprints/barber-apprenticeship.ts');

function collectSeedSlugs(): string[] {
  const slugs: string[] = [];
  for (const mod of barberCourseSeed.modules) {
    for (const l of mod.lessons) slugs.push(l.slug);
    if (mod.checkpoint) slugs.push(mod.checkpoint.slug);
  }
  return slugs.sort();
}

function collectBlueprintSlugs(content: string): string[] {
  return [...content.matchAll(/slug:\s*'([^']+)'/g)]
    .map(m => m[1])
    .filter(s =>
      s.startsWith('barber-lesson-') ||
      (s.startsWith('barber-module-') && s.endsWith('-checkpoint')) ||
      s === 'barber-indiana-state-board-exam'
    )
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
}

function main(): void {
  const blueprint = fs.readFileSync(blueprintPath, 'utf8');
  const seedSlugs = collectSeedSlugs();
  const blueprintSlugs = collectBlueprintSlugs(blueprint);

  const seedOnly = seedSlugs.filter(s => !blueprintSlugs.includes(s));
  const blueprintOnly = blueprintSlugs.filter(s => !seedSlugs.includes(s));

  console.log(`Seed slugs:      ${seedSlugs.length}`);
  console.log(`Blueprint slugs: ${blueprintSlugs.length}`);

  if (seedOnly.length) {
    console.error('\nIn seeds only (not in blueprint):');
    seedOnly.forEach(s => console.error(`  - ${s}`));
  }
  if (blueprintOnly.length) {
    console.error('\nIn blueprint only (not in seeds):');
    blueprintOnly.forEach(s => console.error(`  - ${s}`));
  }
  if (seedOnly.length || blueprintOnly.length) {
    console.error('\nFAIL: seeds do not fully own the course blueprint.');
    process.exit(1);
  }
  console.log('\nPASS: seeds fully own the course blueprint.');
}

main();
