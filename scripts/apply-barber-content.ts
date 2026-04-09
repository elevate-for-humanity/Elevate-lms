/**
 * scripts/apply-barber-content.ts
 *
 * Applies barber lesson content to course_lessons via the Supabase JS client.
 * Reads content from the blueprint (all lessons) and quiz_questions from
 * the migration SQL files (Modules 1–3 only — others not yet authored).
 *
 * Usage:
 *   pnpm tsx scripts/apply-barber-content.ts
 *   pnpm tsx scripts/apply-barber-content.ts --dry-run
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { barberApprenticeshipBlueprint } from '../lib/curriculum/blueprints/barber-apprenticeship';

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const DRY_RUN   = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractQuizFromMigration(filepath: string): Map<string, unknown[]> {
  const map = new Map<string, unknown[]>();
  if (!fs.existsSync(filepath)) return map;
  const sql = fs.readFileSync(filepath, 'utf8');
  const slugPattern = /slug\s*=\s*'([^']+)'/g;
  const quizPattern = /quiz_questions\s*=\s*'(\[[\s\S]*?\])'\s*::jsonb/g;
  const slugs: string[] = [];
  const quizzes: unknown[][] = [];
  let m;
  while ((m = slugPattern.exec(sql)) !== null) slugs.push(m[1]);
  while ((m = quizPattern.exec(sql)) !== null) {
    try { quizzes.push(JSON.parse(m[1])); } catch { quizzes.push([]); }
  }
  for (let i = 0; i < Math.min(slugs.length, quizzes.length); i++) {
    map.set(slugs[i], quizzes[i]);
  }
  return map;
}

function extractPassingScoreFromMigration(filepath: string): Map<string, number> {
  const map = new Map<string, number>();
  if (!fs.existsSync(filepath)) return map;
  const sql = fs.readFileSync(filepath, 'utf8');
  const blocks = sql.split(/(?=\n  UPDATE public\.course_lessons)/);
  for (const block of blocks) {
    const slugMatch  = block.match(/slug\s*=\s*'([^']+)'/);
    const scoreMatch = block.match(/passing_score\s*=\s*(\d+)/);
    if (slugMatch && scoreMatch) map.set(slugMatch[1], parseInt(scoreMatch[1]));
  }
  return map;
}

const migrationFiles = [
  'supabase/migrations/20260618000001_module1_full_content.sql',
  'supabase/migrations/20260618000003_module2_content.sql',
  'supabase/migrations/20260618000004_module3_content_part1.sql',
  'supabase/migrations/20260618000005_module3_content_part2.sql',
];

const quizMap         = new Map<string, unknown[]>();
const passingScoreMap = new Map<string, number>();
for (const f of migrationFiles) {
  for (const [slug, qq] of extractQuizFromMigration(f))       quizMap.set(slug, qq);
  for (const [slug, ps] of extractPassingScoreFromMigration(f)) passingScoreMap.set(slug, ps);
}

console.log(`Quiz data loaded for ${quizMap.size} lessons`);
console.log(`Passing score loaded for ${passingScoreMap.size} lessons`);

async function main() {
  let updated = 0, skipped = 0, errors = 0;

  for (const mod of barberApprenticeshipBlueprint.modules) {
    for (const lesson of mod.lessons) {
      const l = lesson as any;
      const hasContent = !!l.content;
      const hasQuiz    = quizMap.has(lesson.slug) || !!l.quizQuestions;
      const hasVideo   = !!l.videoFile;

      if (!hasContent && !hasQuiz && !hasVideo) { skipped++; continue; }

      const payload: Record<string, unknown> = {
        updated_at:   new Date().toISOString(),
        is_published: true,
      };

      if (lesson.title)  payload.title     = lesson.title;
      if (hasContent)    payload.content   = l.content;
      if (hasVideo)      payload.video_url = l.videoFile;

      const qq = quizMap.get(lesson.slug) ?? l.quizQuestions;
      if (qq)  payload.quiz_questions = qq;

      const ps = passingScoreMap.get(lesson.slug) ?? l.passingScore;
      if (ps)  payload.passing_score  = ps;

      process.stdout.write(`  ${lesson.slug} ... `);

      if (DRY_RUN) {
        const qCount = Array.isArray(qq) ? qq.length : 0;
        console.log(`[dry-run] quiz_count=${qCount} fields=${Object.keys(payload).join(',')}`);
        updated++;
        continue;
      }

      const { error } = await supabase
        .from('course_lessons')
        .update(payload)
        .eq('course_id', COURSE_ID)
        .eq('slug', lesson.slug);

      if (error) { console.log(`ERROR: ${error.message}`); errors++; }
      else       { console.log('OK'); updated++; }
    }
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} errors=${errors}`);
}

main().catch(console.error);
