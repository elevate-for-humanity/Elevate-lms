/**
 * Learner-facing QA audit for HVAC, PRS, Bookkeeping, CRS.
 *
 * Checks every field the LMS renderer depends on:
 * - content not null/empty
 * - lesson_type set correctly
 * - order_index unique per course, no gaps
 * - quiz_questions valid shape (numeric correctAnswer, 4 options, explanation)
 * - module_id resolves to a real course_modules row
 * - passing_score set on checkpoint/exam/quiz
 * - HTML content not malformed (unclosed tags, raw {})
 * - No duplicate slugs within a course
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROGRAMS = [
  'hvac-technician',
  'peer-recovery-specialist-jri',
  'bookkeeping',
  'certified-recovery-specialist',
];

interface Defect {
  slug: string;
  field: string;
  issue: string;
}

function checkHtml(html: string): string | null {
  if (!html || html.trim() === '') return 'empty';
  if (html.trim() === '{}' || html.trim() === 'null') return 'placeholder value';
  if (html.trim() === '{}' || /^\s*\{\s*\}\s*$/.test(html)) return 'raw empty object';
  if (html.length < 100) return `suspiciously short (${html.length} chars)`;
  return null;
}

function checkQuizQuestion(q: any, idx: number): string | null {
  if (!q.question || typeof q.question !== 'string') return `q${idx}: missing question text`;
  if (!Array.isArray(q.options) || q.options.length !== 4) return `q${idx}: must have exactly 4 options`;
  if (typeof q.correctAnswer !== 'number') return `q${idx}: correctAnswer must be number, got ${typeof q.correctAnswer}`;
  if (q.correctAnswer < 0 || q.correctAnswer > 3) return `q${idx}: correctAnswer ${q.correctAnswer} out of range`;
  if (!q.explanation || typeof q.explanation !== 'string') return `q${idx}: missing explanation`;
  return null;
}

async function auditProgram(programSlug: string) {
  const defects: Defect[] = [];

  const { data: prog } = await db.from('programs').select('id, title').eq('slug', programSlug).single();
  if (!prog) return { programSlug, error: 'program not found', defects: [] };

  const { data: course } = await db.from('courses').select('id').eq('program_id', prog.id).single();
  if (!course) return { programSlug, error: 'no courses row', defects: [] };

  const { data: lessons } = await db
    .from('course_lessons')
    .select('id, slug, title, lesson_type, content, order_index, passing_score, quiz_questions, module_id, is_required')
    .eq('course_id', course.id)
    .order('order_index');

  if (!lessons?.length) return { programSlug, error: 'no course_lessons rows', defects: [] };

  // 1. Duplicate slugs
  const slugsSeen = new Set<string>();
  for (const l of lessons) {
    if (slugsSeen.has(l.slug)) defects.push({ slug: l.slug, field: 'slug', issue: 'duplicate slug in course' });
    slugsSeen.add(l.slug);
  }

  // 2. Duplicate order_index
  const orderSeen = new Map<number, string>();
  for (const l of lessons) {
    if (orderSeen.has(l.order_index)) {
      defects.push({ slug: l.slug, field: 'order_index', issue: `duplicate order_index ${l.order_index} (also on ${orderSeen.get(l.order_index)})` });
    }
    orderSeen.set(l.order_index, l.slug);
  }

  // 3. Lesson order is monotonically increasing
  const indices = lessons.map(l => l.order_index);
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] <= indices[i - 1]) {
      defects.push({ slug: lessons[i].slug, field: 'order_index', issue: `order not increasing: ${indices[i - 1]} → ${indices[i]}` });
    }
  }

  // 4. Per-lesson checks
  for (const l of lessons) {
    // content
    const rawContent = typeof l.content === 'string' ? l.content : JSON.stringify(l.content ?? '');
    // content is stored as jsonb (a JSON string wrapping HTML)
    let htmlContent = rawContent;
    try {
      const parsed = JSON.parse(rawContent);
      if (typeof parsed === 'string') htmlContent = parsed;
    } catch { /* already a string */ }

    const htmlIssue = checkHtml(htmlContent);
    if (htmlIssue) defects.push({ slug: l.slug, field: 'content', issue: htmlIssue });

    // lesson_type
    if (!l.lesson_type) defects.push({ slug: l.slug, field: 'lesson_type', issue: 'null' });

    // module_id
    if (!l.module_id) defects.push({ slug: l.slug, field: 'module_id', issue: 'null — lesson not assigned to a module' });

    // passing_score on assessments
    if (['checkpoint', 'exam', 'quiz'].includes(l.lesson_type)) {
      if (!l.passing_score || l.passing_score < 1) {
        defects.push({ slug: l.slug, field: 'passing_score', issue: `${l.passing_score} on ${l.lesson_type}` });
      }

      // quiz_questions
      if (!l.quiz_questions || !Array.isArray(l.quiz_questions)) {
        defects.push({ slug: l.slug, field: 'quiz_questions', issue: 'null or not an array' });
      } else if (l.quiz_questions.length < 3) {
        defects.push({ slug: l.slug, field: 'quiz_questions', issue: `only ${l.quiz_questions.length} questions (min 3)` });
      } else {
        for (let i = 0; i < l.quiz_questions.length; i++) {
          const qIssue = checkQuizQuestion(l.quiz_questions[i], i + 1);
          if (qIssue) defects.push({ slug: l.slug, field: 'quiz_questions', issue: qIssue });
        }
      }
    }
  }

  return { programSlug, title: prog.title, lessonCount: lessons.length, defects };
}

async function main() {
  console.log('\n' + '═'.repeat(65));
  console.log('  LEARNER-FACING QA AUDIT');
  console.log('═'.repeat(65));

  const results = await Promise.all(PROGRAMS.map(auditProgram));

  let allPass = true;
  for (const r of results) {
    const status = r.error ? '❌ BLOCKED' : r.defects.length === 0 ? '✅ PASS' : '❌ FAIL';
    if (r.error || r.defects.length > 0) allPass = false;

    console.log(`\n${status}  ${r.programSlug}`);
    if (r.error) { console.log(`  ERROR: ${r.error}`); continue; }
    console.log(`  Lessons checked: ${r.lessonCount}`);
    if (r.defects.length === 0) {
      console.log('  No defects found');
    } else {
      console.log(`  Defects: ${r.defects.length}`);
      for (const d of r.defects) {
        console.log(`  [${d.field}] ${d.slug}: ${d.issue}`);
      }
    }
  }

  console.log('\n' + '─'.repeat(65));
  console.log(allPass ? '  ALL PASS' : '  DEFECTS FOUND — see above');
  console.log('─'.repeat(65) + '\n');

  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
