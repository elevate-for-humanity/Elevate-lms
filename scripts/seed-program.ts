/**
 * scripts/seed-program.ts
 *
 * Parameterized program seed factory.
 * Takes a blueprint file and seeds all required relations for a program.
 * Safe to re-run — idempotent on all tables.
 *
 * Usage:
 *   pnpm tsx scripts/seed-program.ts --blueprint scripts/blueprints/cna.ts
 *   pnpm tsx scripts/seed-program.ts --blueprint scripts/blueprints/barber-apprenticeship.ts --publish
 *   pnpm tsx scripts/seed-program.ts --list
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Blueprint contract ────────────────────────────────────────────────────────

export type LessonBlueprint = {
  lesson_number: number;
  title: string;
  lesson_type: 'lesson' | 'quiz' | 'lab' | 'exam' | 'orientation';
  duration_minutes: number;
  sort_order: number;
};

export type ModuleBlueprint = {
  module_number: number;
  title: string;
  description: string;
  lesson_count: number;
  duration_hours: number;
  sort_order: number;
  lessons: LessonBlueprint[];
};

export type CTABlueprint = {
  cta_type: 'apply' | 'request_info' | 'external' | 'waitlist';
  label: string;
  href: string;
  style_variant: 'primary' | 'secondary' | 'ghost' | 'link';
  is_external: boolean;
  sort_order: number;
};

export type TrackBlueprint = {
  track_code: string;
  title: string;
  description: string;
  funding_type: 'funded' | 'self_pay' | 'partner' | 'employer_sponsored' | 'other';
  cost_cents: number | null;
  available: boolean;
  coming_soon_message: string | null;
  sort_order: number;
};

/** The full contract every program blueprint must satisfy. */
export type ProgramBlueprint = {
  /** Must match programs.id in the DB */
  program_id: string;
  slug: string;
  hero_headline: string;
  hero_subheadline: string;
  length_weeks: number;
  certificate_title: string;
  funding: string;
  outcomes: string;
  requirements: string;
  hero_image_url: string;
  hero_image_alt: string;
  ctas: CTABlueprint[];
  tracks: TrackBlueprint[];
  modules: ModuleBlueprint[];
};

// ── Seeder ────────────────────────────────────────────────────────────────────

async function seedProgram(blueprint: ProgramBlueprint, publish: boolean) {
  const { program_id, slug } = blueprint;
  console.log(`\nSeeding: ${slug} (${program_id})\n`);

  // 1. Patch programs row
  const { error: pErr } = await db.from('programs').update({
    hero_headline:     blueprint.hero_headline,
    hero_subheadline:  blueprint.hero_subheadline,
    length_weeks:      blueprint.length_weeks,
    certificate_title: blueprint.certificate_title,
    funding:           blueprint.funding,
    outcomes:          blueprint.outcomes,
    requirements:      blueprint.requirements,
    ...(publish ? { published: true } : {}),
  }).eq('id', program_id);
  if (pErr) { console.error('programs patch failed:', pErr.message); process.exit(1); }
  console.log('✅ programs row patched');

  // 2. program_media
  await db.from('program_media').delete().eq('program_id', program_id);
  const { error: mErr } = await db.from('program_media').insert([{
    program_id,
    media_type: 'hero_image',
    url:        blueprint.hero_image_url,
    alt_text:   blueprint.hero_image_alt,
    sort_order: 1,
  }]);
  if (mErr) { console.error('program_media failed:', mErr.message); process.exit(1); }
  console.log('✅ program_media inserted');

  // 3. program_ctas
  await db.from('program_ctas').delete().eq('program_id', program_id);
  const { error: cErr } = await db.from('program_ctas').insert(
    blueprint.ctas.map(c => ({ program_id, ...c }))
  );
  if (cErr) { console.error('program_ctas failed:', cErr.message); process.exit(1); }
  console.log('✅ program_ctas inserted');

  // 4. program_tracks — upsert by (program_id, track_code)
  for (const track of blueprint.tracks) {
    const { error: tErr } = await db.from('program_tracks').upsert(
      { program_id, ...track },
      { onConflict: 'program_id,track_code' }
    );
    if (tErr) { console.error(`program_tracks failed (${track.track_code}):`, tErr.message); process.exit(1); }
  }
  console.log('✅ program_tracks upserted');

  // 5. program_modules + program_lessons
  for (const mod of blueprint.modules) {
    const { lessons, ...modRow } = mod;
    const { data: upserted, error: modErr } = await db
      .from('program_modules')
      .upsert({ program_id, ...modRow }, { onConflict: 'program_id,module_number' })
      .select('id')
      .single();
    if (modErr || !upserted) {
      console.error(`program_modules failed (module ${mod.module_number}):`, modErr?.message);
      process.exit(1);
    }
    await db.from('program_lessons').delete().eq('module_id', upserted.id);
    const { error: lErr } = await db.from('program_lessons').insert(
      lessons.map(l => ({ module_id: upserted.id, ...l }))
    );
    if (lErr) {
      console.error(`program_lessons failed (module ${mod.module_number}):`, lErr.message);
      process.exit(1);
    }
    console.log(`  ✅ Module ${mod.module_number}: ${mod.title} (${lessons.length} lessons)`);
  }

  if (publish) {
    console.log(`\n✅ ${slug} seeded and published.`);
  } else {
    console.log(`\n✅ ${slug} seeded (unpublished). Run with --publish to make live.`);
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const dir = path.resolve(process.cwd(), 'scripts/blueprints');
    if (!fs.existsSync(dir)) { console.log('No blueprints yet. Create scripts/blueprints/<slug>.ts'); return; }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
    if (!files.length) { console.log('No blueprints yet.'); return; }
    console.log('Available blueprints:');
    files.forEach(f => console.log(`  scripts/blueprints/${f}`));
    return;
  }

  const bpIdx = args.indexOf('--blueprint');
  if (bpIdx === -1 || !args[bpIdx + 1]) {
    console.error('Usage: pnpm tsx scripts/seed-program.ts --blueprint scripts/blueprints/<slug>.ts [--publish]');
    process.exit(1);
  }

  const blueprintPath = path.resolve(process.cwd(), args[bpIdx + 1]);
  if (!fs.existsSync(blueprintPath)) {
    console.error(`Blueprint not found: ${blueprintPath}`);
    process.exit(1);
  }

  const publish = args.includes('--publish');
  const mod = await import(blueprintPath);
  const blueprint: ProgramBlueprint = mod.blueprint ?? mod.default;
  if (!blueprint) {
    console.error('Blueprint file must export a named "blueprint" or default export.');
    process.exit(1);
  }
  await seedProgram(blueprint, publish);
}

main().catch(err => { console.error(err); process.exit(1); });
