/**
 * Audit all 50 barber course lessons for completeness.
 *
 * Reports:
 *   - Missing learning_objectives
 *   - Missing video_url
 *   - Missing quiz_questions
 *   - Missing passing_score
 *   - practical_required=true but no competency_checks
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/audit-barber-course.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-barber-course.ts --patch   # auto-patch passing_score gaps
 */

import { createClient } from '@supabase/supabase-js';

const BARBER_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const PATCH_MODE = process.argv.includes('--patch');

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id, slug, title, lesson_type, order_index, practical_required, passing_score, learning_objectives, competency_checks, quiz_questions, video_url')
    .eq('course_id', BARBER_COURSE_ID)
    .order('order_index');

  if (error) { console.error('DB error:', error.message); process.exit(1); }
  if (!lessons?.length) { console.error('No lessons found for course', BARBER_COURSE_ID); process.exit(1); }

  console.log(`\nBarber Course Audit — ${lessons.length} lessons\n`);
  console.log('Slug'.padEnd(26), 'Type'.padEnd(12), 'Obj', 'Vid', 'Quiz', 'Score', 'Checks', 'Issues');
  console.log('─'.repeat(90));

  const issues: { slug: string; problems: string[] }[] = [];
  const needsPassingScore: string[] = [];

  for (const l of lessons) {
    const objs   = Array.isArray(l.learning_objectives) ? l.learning_objectives.length : 0;
    const quiz   = Array.isArray(l.quiz_questions)      ? l.quiz_questions.length      : 0;
    const checks = Array.isArray(l.competency_checks)   ? l.competency_checks.length   : 0;
    const hasVid = !!l.video_url;
    const hasScore = l.passing_score != null;

    // Checkpoints and exams are quiz-only — video is optional for them
    const videoRequired = l.lesson_type !== 'checkpoint' && l.lesson_type !== 'exam';

    const problems: string[] = [];
    if (!objs)                  problems.push('no objectives');
    if (!hasVid && videoRequired) problems.push('no video');
    if (!quiz)                  problems.push('no quiz_questions');
    if (!hasScore && (l.lesson_type === 'checkpoint' || l.lesson_type === 'quiz' || l.lesson_type === 'exam' || l.practical_required))
                                problems.push('no passing_score');
    if (l.practical_required && !checks)
                                problems.push('practical but no competency_checks');

    if (!hasScore && l.practical_required) needsPassingScore.push(l.id);

    const flag = (v: boolean) => v ? '✅' : '❌';
    console.log(
      l.slug.padEnd(26),
      (l.lesson_type ?? '').padEnd(12),
      flag(objs > 0).padEnd(4),
      flag(hasVid).padEnd(4),
      flag(quiz > 0).padEnd(5),
      flag(hasScore).padEnd(6),
      flag(checks > 0 || !l.practical_required).padEnd(7),
      problems.length ? problems.join(', ') : '—',
    );

    if (problems.length) issues.push({ slug: l.slug, problems });
  }

  console.log('\n' + '─'.repeat(90));
  console.log(`\nTotal issues: ${issues.length} lessons with gaps\n`);

  if (issues.length) {
    console.log('Lessons needing attention:');
    for (const { slug, problems } of issues) {
      console.log(`  ${slug}: ${problems.join(', ')}`);
    }
  }

  if (PATCH_MODE && needsPassingScore.length) {
    console.log(`\n[PATCH] Setting passing_score=70 on ${needsPassingScore.length} practical lessons...`);
    const { error: patchErr } = await db
      .from('course_lessons')
      .update({ passing_score: 70 })
      .in('id', needsPassingScore);
    if (patchErr) console.error('[PATCH] Failed:', patchErr.message);
    else console.log('[PATCH] Done.');
  } else if (needsPassingScore.length) {
    console.log(`\nRun with --patch to auto-set passing_score=70 on ${needsPassingScore.length} practical lessons.`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
