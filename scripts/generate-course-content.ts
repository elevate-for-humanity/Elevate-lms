#!/usr/bin/env tsx
/**
 * Batch content generator for CRS and Bookkeeping programs.
 *
 * For each lesson missing script_text (or with placeholder content),
 * calls OpenAI to generate instructional narration, then writes back
 * to curriculum_lessons. For checkpoint/exam lessons, also generates
 * quiz_questions in the correct numeric-index format.
 *
 * After all lessons for a program are written, runs
 * promote_to_course_lessons() and reports the result.
 *
 * Usage:
 *   pnpm tsx scripts/generate-course-content.ts --program certified-recovery-specialist
 *   pnpm tsx scripts/generate-course-content.ts --program bookkeeping
 *   pnpm tsx scripts/generate-course-content.ts --all
 *   pnpm tsx scripts/generate-course-content.ts --dry-run --program bookkeeping
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const MODEL = 'claude-sonnet-4-6';

const MIN_CONTENT_LENGTH = 300;
const TARGET_WORD_COUNT = 900; // ~1100 chars minimum after generation

const PROGRAMS = ['certified-recovery-specialist', 'bookkeeping'] as const;
type ProgramSlug = typeof PROGRAMS[number];

// ── Program context for prompt grounding ─────────────────────────────────────

const PROGRAM_CONTEXT: Record<ProgramSlug, string> = {
  'certified-recovery-specialist': `
Program: Certified Recovery Specialist (CRS) — Indiana
Audience: Adults pursuing CRS certification to work as peer recovery support specialists
in behavioral health, substance use recovery, and community service settings.
Credential: Indiana CRS certification through DMHA/IC&RC pathway.
Tone: Professional, direct, adult-learner appropriate. Job-relevant. Not clinical.
The learner will use this knowledge on the job the day they are certified.
`.trim(),

  bookkeeping: `
Program: Bookkeeping Fundamentals with QuickBooks Online
Audience: Adults entering bookkeeping, accounting support, or small business finance roles.
Credential: QuickBooks Certified User (QBCU) and/or MOS Excel certification pathway.
Tone: Clear, practical, step-by-step where appropriate. Job-relevant.
The learner will use this knowledge in real bookkeeping work immediately after certification.
`.trim(),
};

// ── Module titles for context ─────────────────────────────────────────────────

const MODULE_TITLES: Record<ProgramSlug, Record<number, string>> = {
  'certified-recovery-specialist': {
    0: 'Foundations of Recovery Support',
    1: 'Advocacy and Resource Navigation',
    2: 'Building Recovery Relationships',
    3: 'Recovery Education and Skill Building',
    4: 'Wellness and Long-Term Recovery',
    5: 'Ethics, Confidentiality, and Professional Practice',
    6: 'Cultural Humility and Trauma-Informed Practice',
    7: 'Professional Development and Certification',
  },
  bookkeeping: {
    0: 'Bookkeeping Fundamentals',
    1: 'QuickBooks Online Setup',
    2: 'Recording Transactions',
    3: 'Reporting and Payroll',
    4: 'Certification Preparation',
  },
};

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL = args.includes('--all');
const FORCE = args.includes('--force'); // regenerate even if content exists
const programArg = args.find(a => a.startsWith('--program='))?.split('=')[1]
  ?? (args[args.indexOf('--program') + 1] ?? null);

if (!ALL && !programArg) {
  console.error('Usage: --program <slug> | --all  [--dry-run] [--force]');
  process.exit(1);
}

const targetPrograms: ProgramSlug[] = ALL
  ? [...PROGRAMS]
  : [programArg as ProgramSlug];

for (const p of targetPrograms) {
  if (!PROGRAMS.includes(p as ProgramSlug)) {
    console.error(`Unknown program: ${p}. Valid: ${PROGRAMS.join(', ')}`);
    process.exit(1);
  }
}

// ── Clients ───────────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY — add it to .env.local and rerun');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  lesson_slug: string;
  lesson_title: string;
  module_order: number;
  lesson_order: number;
  step_type: string;
  script_text: string | null;
  quiz_questions: unknown | null;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index — required by QuizPlayer
  explanation: string;
}

interface GeneratedContent {
  script_text: string;
  summary_text: string;
  reflection_prompt: string;
  job_application: string;
  quiz_questions?: QuizQuestion[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPlaceholder(text: string | null): boolean {
  if (!text) return true;
  const t = text.trim();
  if (t.length < MIN_CONTENT_LENGTH) return true;
  if (t === '{}' || t === 'null') return true;
  const lower = t.toLowerCase();
  const boilerplate = [
    'todo', 'placeholder', 'coming soon', 'content here',
    'lesson content', 'tbd', 'to be written',
  ];
  return boilerplate.some(b => lower.startsWith(b));
}

function needsContent(lesson: Lesson, force: boolean): boolean {
  if (force) return true;
  if (lesson.step_type === 'lesson' || lesson.step_type === 'lab' || lesson.step_type === 'assignment') {
    return isPlaceholder(lesson.script_text);
  }
  if (['checkpoint', 'quiz', 'exam'].includes(lesson.step_type)) {
    const noScript = isPlaceholder(lesson.script_text);
    const noQuiz = !lesson.quiz_questions
      || !Array.isArray(lesson.quiz_questions)
      || (lesson.quiz_questions as unknown[]).length < 3;
    return noScript || noQuiz;
  }
  return false;
}

function slugId(slug: string, index: number): string {
  return `${slug.replace(/-/g, '').slice(-8)}-q${index + 1}`;
}

// ── OpenAI generation ─────────────────────────────────────────────────────────

async function generateLessonContent(
  lesson: Lesson,
  programSlug: ProgramSlug,
): Promise<GeneratedContent> {
  const ctx = PROGRAM_CONTEXT[programSlug];
  const moduleTitle = MODULE_TITLES[programSlug][lesson.module_order] ?? `Module ${lesson.module_order}`;
  const isAssessment = ['checkpoint', 'quiz', 'exam'].includes(lesson.step_type);

  const systemPrompt = `You are an instructional content writer for a workforce development LMS.
${ctx}

Write in second person ("you", "your") addressing the learner directly.
Be specific and practical. No filler. No motivational fluff.
Every sentence must add information the learner can use on the job.`;

  const userPrompt = isAssessment
    ? `Write content for this assessment lesson:

Module: ${moduleTitle}
Lesson: ${lesson.lesson_title}
Type: ${lesson.step_type}

Return a JSON object with these exact keys:
{
  "script_text": "A 400-600 word review of the key concepts this assessment covers. Written as a study guide / pre-quiz review, not as a quiz itself. Covers the main ideas from the module.",
  "summary_text": "2-3 sentence summary of what this assessment measures.",
  "reflection_prompt": "One reflective question the learner should consider before attempting the assessment.",
  "job_application": "One sentence describing how mastery of these concepts applies on the job.",
  "quiz_questions": [
    {
      "id": "unique-id",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}

Generate exactly 5 quiz questions. correctAnswer is the 0-based index of the correct option in the options array.
Questions must test the concepts covered in the module, not general knowledge.
Each question must have exactly 4 options. One correct answer per question.
Return only valid JSON. No markdown fences.`
    : `Write content for this lesson:

Module: ${moduleTitle}
Lesson: ${lesson.lesson_title}
Type: ${lesson.step_type}

Return a JSON object with these exact keys:
{
  "script_text": "Full instructional narration for this lesson. Target 800-1000 words. Structure: (1) opening framing — what this covers and why it matters on the job, (2) core concept explanation, (3) practical example or scenario, (4) applied guidance for real work situations, (5) short recap. Write in second person. Be specific. No filler.",
  "summary_text": "2-3 sentence summary of the key takeaway from this lesson.",
  "reflection_prompt": "One reflective question that helps the learner connect this lesson to their own experience or future work.",
  "job_application": "One concrete sentence describing how this lesson applies in a real work situation."
}

Return only valid JSON. No markdown fences.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    temperature: 0.4,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';

  let parsed: GeneratedContent;
  try {
    // Strip markdown fences if model added them despite instructions
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON parse failed for ${lesson.lesson_slug}:\n${raw.slice(0, 300)}`);
  }

  // Validate
  if (!parsed.script_text || parsed.script_text.trim().length < MIN_CONTENT_LENGTH) {
    throw new Error(`script_text too short for ${lesson.lesson_slug} (${parsed.script_text?.length ?? 0} chars)`);
  }

  if (isAssessment) {
    if (!Array.isArray(parsed.quiz_questions) || parsed.quiz_questions.length < 3) {
      throw new Error(`quiz_questions missing or too few for ${lesson.lesson_slug}`);
    }
    // Enforce numeric correctAnswer and assign stable IDs
    parsed.quiz_questions = parsed.quiz_questions.map((q, i) => {
      const ca = typeof q.correctAnswer === 'string'
        ? q.options.indexOf(q.correctAnswer)
        : Number(q.correctAnswer);
      if (ca < 0 || ca >= q.options.length) {
        throw new Error(`Invalid correctAnswer for question ${i} in ${lesson.lesson_slug}`);
      }
      return { ...q, id: slugId(lesson.lesson_slug, i), correctAnswer: ca };
    });
  }

  return parsed;
}

// ── DB write ──────────────────────────────────────────────────────────────────

async function writeContent(lesson: Lesson, content: GeneratedContent): Promise<void> {
  const update: Record<string, unknown> = {
    script_text: content.script_text,
    summary_text: content.summary_text,
    reflection_prompt: content.reflection_prompt,
    job_application: content.job_application,
    updated_at: new Date().toISOString(),
  };
  if (content.quiz_questions) {
    update.quiz_questions = content.quiz_questions;
  }

  const { error } = await db
    .from('curriculum_lessons')
    .update(update)
    .eq('id', lesson.id);

  if (error) throw new Error(`DB write failed for ${lesson.lesson_slug}: ${error.message}`);
}

// ── Promotion ─────────────────────────────────────────────────────────────────

async function promote(programSlug: string): Promise<{ promoted: number; error?: string }> {
  const { data, error } = await db.rpc('promote_to_course_lessons', {
    p_program_slug: programSlug,
  });
  if (error) return { promoted: 0, error: error.message };
  return { promoted: Array.isArray(data) ? data.length : 0 };
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface ProgramReport {
  program: string;
  total: number;
  needed: number;
  generated: number;
  failed: string[];
  promoted: number;
  promotionError?: string;
}

async function processProgram(programSlug: ProgramSlug): Promise<ProgramReport> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${programSlug}`);
  console.log('═'.repeat(60));

  // Fetch all published lessons for this program
  const { data: programRow } = await db
    .from('programs')
    .select('id, title')
    .eq('slug', programSlug)
    .single();

  if (!programRow) throw new Error(`Program not found: ${programSlug}`);

  const { data: lessons, error: fetchErr } = await db
    .from('curriculum_lessons')
    .select('id, lesson_slug, lesson_title, module_order, lesson_order, step_type, script_text, quiz_questions')
    .eq('program_id', programRow.id)
    .eq('status', 'published')
    .order('module_order')
    .order('lesson_order');

  if (fetchErr) throw new Error(`Fetch failed: ${fetchErr.message}`);
  if (!lessons?.length) throw new Error(`No published lessons found for ${programSlug}`);

  const toGenerate = lessons.filter(l => needsContent(l as Lesson, FORCE));
  const report: ProgramReport = {
    program: programSlug,
    total: lessons.length,
    needed: toGenerate.length,
    generated: 0,
    failed: [],
    promoted: 0,
  };

  console.log(`  Total lessons : ${lessons.length}`);
  console.log(`  Need content  : ${toGenerate.length}`);
  if (DRY_RUN) {
    console.log('  [DRY RUN] — no writes');
    toGenerate.forEach(l => console.log(`    - ${l.lesson_slug} (${l.step_type})`));
    return report;
  }

  // Generate content lesson by lesson
  for (const lesson of toGenerate as Lesson[]) {
    const tag = `[${lesson.module_order}.${lesson.lesson_order}] ${lesson.lesson_title}`;
    process.stdout.write(`  Generating ${tag} ... `);
    try {
      const content = await generateLessonContent(lesson, programSlug);
      await writeContent(lesson, content);
      report.generated++;
      console.log(`✅ (${content.script_text.length} chars${content.quiz_questions ? `, ${content.quiz_questions.length} questions` : ''})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${msg}`);
      report.failed.push(`${lesson.lesson_slug}: ${msg}`);
    }
  }

  // Promote
  if (report.failed.length === 0 || report.generated > 0) {
    console.log(`\n  Running promote_to_course_lessons('${programSlug}') ...`);
    const result = await promote(programSlug);
    report.promoted = result.promoted;
    report.promotionError = result.error;
    if (result.error) {
      console.log(`  ❌ Promotion failed: ${result.error}`);
    } else {
      console.log(`  ✅ Promoted ${result.promoted} lessons`);
    }
  } else {
    console.log('\n  ⚠️  Skipping promotion — all lessons failed generation');
  }

  return report;
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  COURSE CONTENT GENERATOR');
  console.log('  Programs: ' + targetPrograms.join(', '));
  if (DRY_RUN) console.log('  MODE: DRY RUN');
  if (FORCE) console.log('  MODE: FORCE (regenerating existing content)');
  console.log('═'.repeat(60));

  const reports: ProgramReport[] = [];

  for (const program of targetPrograms) {
    try {
      const report = await processProgram(program);
      reports.push(report);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n❌ Fatal error for ${program}: ${msg}`);
      reports.push({
        program,
        total: 0,
        needed: 0,
        generated: 0,
        failed: [msg],
        promoted: 0,
        promotionError: 'skipped due to fatal error',
      });
    }
  }

  // Final report
  console.log('\n' + '═'.repeat(60));
  console.log('  COMPLETION REPORT');
  console.log('═'.repeat(60));

  for (const r of reports) {
    console.log(`\n  ${r.program}`);
    console.log(`    Total lessons      : ${r.total}`);
    console.log(`    Needed generation  : ${r.needed}`);
    console.log(`    Generated          : ${r.generated}`);
    console.log(`    Failed             : ${r.failed.length}`);
    if (r.failed.length) {
      r.failed.forEach(f => console.log(`      - ${f}`));
    }
    console.log(`    Promoted           : ${r.promoted}`);
    if (r.promotionError) {
      console.log(`    Promotion error    : ${r.promotionError}`);
    }
    const status = r.failed.length === 0 && !r.promotionError ? '✅ COMPLETE' : '❌ INCOMPLETE';
    console.log(`    Status             : ${status}`);
  }

  const anyFailed = reports.some(r => r.failed.length > 0 || r.promotionError);
  process.exit(anyFailed ? 1 : 0);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
