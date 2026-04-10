/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const BLUEPRINT_FILE = path.resolve(ROOT, 'lib/curriculum/blueprints/barber-apprenticeship.ts');
const GENERATOR_FILE = path.resolve(ROOT, 'scripts/generate-barber-course.ts');
const GENERATED_FILE = path.resolve(ROOT, 'scripts/generated/barber-course.generated.ts');

function readFileSafe(file: string): string {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function uniq<T>(arr: T[]): T[] { return [...new Set(arr)]; }
function sortAlpha(arr: string[]): string[] { return [...arr].sort((a, b) => a.localeCompare(b)); }

function extractAll(regex: RegExp, text: string): string[] {
  const out: string[] = [];
  let match: RegExpExecArray | null;
  const r = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  while ((match = r.exec(text)) !== null) { if (match[1]) out.push(match[1]); }
  return out;
}

function extractBlueprintLessonSlugs(text: string): string[] {
  return uniq(extractAll(/slug:\s*'((?:barber-lesson-\d+)|(?:barber-module-\d+-checkpoint))'/g, text));
}

function extractBlueprintModuleSlugs(text: string): string[] {
  return uniq(extractAll(/slug:\s*'(barber-module-\d+)'/g, text).filter((s) => !s.endsWith('-checkpoint')));
}

function extractSeedLessonSlugs(text: string): string[] {
  return uniq(extractAll(/slug:\s*'(barber-(?:lesson-\d+|module-\d+-checkpoint))'/g, text));
}

function extractSeedModuleSlugs(text: string): string[] {
  return uniq(extractAll(/moduleSlug:\s*'(barber-module-\d+)'/g, text));
}

function extractGeneratedLessonSlugs(text: string): string[] {
  return uniq(extractAll(/slug:\s*'(barber-(?:lesson-\d+|module-\d+-checkpoint))'/g, text));
}

function extractGeneratedModuleSlugs(text: string): string[] {
  return uniq(extractAll(/moduleSlug:\s*'(barber-module-\d+)'/g, text));
}

function numericLessonSort(a: string, b: string): number {
  const aMatch = a.match(/lesson-(\d+)/);
  const bMatch = b.match(/lesson-(\d+)/);
  if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
  return a.localeCompare(b);
}

function diff(a: string[], b: string[]): string[] { const bSet = new Set(b); return a.filter((x) => !bSet.has(x)); }
function intersect(a: string[], b: string[]): string[] { const bSet = new Set(b); return a.filter((x) => bSet.has(x)); }

function summarizeRange(slugs: string[]): string {
  const nums = slugs.map((s) => s.match(/lesson-(\d+)/)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
  if (!nums.length) return 'none';
  const ranges: string[] = [];
  let start = nums[0]; let prev = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    if (n === prev + 1) { prev = n; continue; }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = n; prev = n;
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

function printSection(title: string, items: string[]): void {
  console.log(`\n=== ${title} (${items.length}) ===`);
  if (!items.length) { console.log('none'); return; }
  for (const item of items) console.log(item);
}

function main(): void {
  const blueprint = readFileSafe(BLUEPRINT_FILE);
  const generator = readFileSafe(GENERATOR_FILE);
  const generated = fs.existsSync(GENERATED_FILE) ? readFileSafe(GENERATED_FILE) : '';

  const blueprintLessons = extractBlueprintLessonSlugs(blueprint).sort(numericLessonSort);
  const blueprintModules = sortAlpha(extractBlueprintModuleSlugs(blueprint));
  const seedLessons = extractSeedLessonSlugs(generator).sort(numericLessonSort);
  const seedModules = sortAlpha(extractSeedModuleSlugs(generator));
  const generatedLessons = extractGeneratedLessonSlugs(generated).sort(numericLessonSort);
  const generatedModules = sortAlpha(extractGeneratedModuleSlugs(generated));

  const liveButNotSeeded = diff(blueprintLessons, seedLessons).sort(numericLessonSort);
  const seededButNotLive = diff(seedLessons, blueprintLessons).sort(numericLessonSort);
  const generatedButNotLive = diff(generatedLessons, blueprintLessons).sort(numericLessonSort);
  const liveAndSeeded = intersect(blueprintLessons, seedLessons).sort(numericLessonSort);
  const modulesLiveButNotSeeded = diff(blueprintModules, seedModules);
  const modulesSeededButNotLive = diff(seedModules, blueprintModules);

  console.log('\nBARBER COURSE GENERATION AUDIT');
  console.log('--------------------------------');
  console.log(`Blueprint modules:              ${blueprintModules.length}`);
  console.log(`Blueprint lessons/checkpoints:  ${blueprintLessons.length}`);
  console.log(`Seed modules:                   ${seedModules.length}`);
  console.log(`Seed lessons/checkpoints:       ${seedLessons.length}`);
  console.log(`Generated modules:              ${generatedModules.length}`);
  console.log(`Generated lessons/checkpoints:  ${generatedLessons.length}`);

  console.log('\nCOVERAGE');
  console.log(`Live + seeded overlap:          ${liveAndSeeded.length}/${blueprintLessons.length}`);
  console.log(`Live lessons missing from seeds: ${liveButNotSeeded.length}`);
  console.log(`Seed lessons not in blueprint:   ${seededButNotLive.length}`);

  printSection('Modules live in blueprint but missing from seeds', modulesLiveButNotSeeded);
  printSection('Modules in seeds but not found in blueprint', modulesSeededButNotLive);
  printSection('Live lesson/checkpoint slugs missing from seeds', liveButNotSeeded);
  printSection('Seeded lesson/checkpoint slugs not found in blueprint', seededButNotLive);
  printSection('Generated lesson/checkpoint slugs not found in blueprint', generatedButNotLive);

  console.log('\nRANGE SUMMARY');
  console.log(`Blueprint lesson ranges:        ${summarizeRange(blueprintLessons)}`);
  console.log(`Seed lesson ranges:             ${summarizeRange(seedLessons)}`);
  console.log(`Missing-from-seeds ranges:      ${summarizeRange(liveButNotSeeded)}`);

  const status = liveButNotSeeded.length === 0 && modulesLiveButNotSeeded.length === 0
    ? 'FULL BLUEPRINT COVERAGE REACHED'
    : 'GENERATOR DOES NOT YET COVER THE FULL BLUEPRINT';

  console.log(`\nSTATUS: ${status}\n`);
}

main();
