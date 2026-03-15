/**
 * PRS curriculum seed — Peer Recovery Specialist (JRI)
 *
 * Reads lesson definitions from lms-data/courses/program-peer-recovery.ts
 * and writes them into curriculum_lessons via CurriculumGenerator.
 *
 * Domain mapping (IN-PRS credential, 5 domains):
 *   recovery_support    — mod-1 (Introduction), mod-3 (Recovery/Wellness), mod-4 (Peer Skills)
 *   ethics_boundaries   — mod-2 (Ethics)
 *   advocacy_navigation — mod-5 (Advocacy), mod-6 (Resource Navigation)
 *   crisis_intervention — mod-7 (Crisis Support)
 *   documentation       — mod-8 (Certification Prep)
 *
 * Run:
 *   npx tsx scripts/seed-prs-curriculum.ts
 *   npx tsx scripts/seed-prs-curriculum.ts --force   (overwrite existing)
 */

import { CurriculumGenerator } from '../lib/services/curriculum-generator';
import { peerRecoveryCourse } from '../lms-data/courses/program-peer-recovery';

const PRS_PROGRAM_ID    = 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d';
const PRS_CREDENTIAL_ID = '00000000-0000-0000-0000-000000000109';
const PRS_COURSE_ID     = '15cc1096-13d7-47ea-a79c-b833cf46776e';

// Maps module id → exam domain key
const MODULE_DOMAIN_MAP: Record<string, string> = {
  'peer-mod-1': 'recovery_support',
  'peer-mod-2': 'ethics_boundaries',
  'peer-mod-3': 'recovery_support',
  'peer-mod-4': 'recovery_support',
  'peer-mod-5': 'advocacy_navigation',
  'peer-mod-6': 'advocacy_navigation',
  'peer-mod-7': 'crisis_intervention',
  'peer-mod-8': 'documentation',
};

// Maps lms-data content_type → curriculum_lessons content_type enum
const CONTENT_TYPE_MAP: Record<string, string> = {
  reading: 'reading',
  video:   'video',
  quiz:    'quiz',
  lab:     'activity',
  audio:   'audio',
};

async function main() {
  const mode = process.argv.includes('--force') ? 'force' : 'seed_missing';
  console.log(`Seeding PRS curriculum (mode: ${mode})`);

  const gen = new CurriculumGenerator(PRS_PROGRAM_ID, PRS_CREDENTIAL_ID, mode as 'seed_missing' | 'force');
  await gen.loadExistingSlugs();

  for (const [modIndex, mod] of peerRecoveryCourse.modules.entries()) {
    const domainKey = MODULE_DOMAIN_MAP[mod.id];
    if (!domainKey) {
      console.warn(`No domain mapping for module ${mod.id} — skipping`);
      continue;
    }

    // Upsert the module
    await gen.upsertModule({
      slug:        mod.id,
      title:       mod.title,
      description: mod.description,
      orderIndex:  modIndex + 1,
    });

    // Upsert all lessons (quiz and non-quiz)
    for (const [lessonIndex, lesson] of mod.lessons.entries()) {
      const lessonSlug = `${mod.id}-${lesson.id}`;
      await gen.upsertLesson({
        lessonSlug,
        lessonTitle:         lesson.title,
        moduleSlug:          mod.id,
        moduleTitle:         mod.title,
        durationMinutes:     lesson.durationMinutes ?? 30,
        lessonOrder:         lessonIndex + 1,
        moduleOrder:         modIndex + 1,
        credentialDomainKey: domainKey,
      });
    }
  }

  const summary = gen.summarize();
  console.log('\nSeed complete:');
  console.log(`  modules:  ${summary.modulesUpserted}`);
  console.log(`  lessons:  ${summary.lessonsUpserted} written, ${summary.lessonsSkipped} skipped`);
  if (summary.errors.length > 0) {
    console.error('\nErrors:');
    summary.errors.forEach(e => console.error(' ', e));
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
