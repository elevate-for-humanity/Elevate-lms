#!/usr/bin/env tsx
/**
 * scripts/course-builder/generate-lesson-content.ts
 *
 * AI-powered content generator for barber course seed files.
 * Generates all content types per lesson and writes to JSON sidecars.
 * TypeScript seed files are NEVER modified.
 *
 * Generates per lesson:
 *   content    — 900–1,100 word Milady-aligned instructional body (markdown)
 *   quiz       — 20 questions (8 recall, 8 scenario, 4 applied judgment)
 *   flashcards — 15 term/definition pairs
 *   procedures — step-by-step procedure (lab/practical lessons only)
 *
 * Generates per checkpoint:
 *   quiz — 20 questions (60 for final exam), scenario-heavy, harder than lessons
 *
 * Usage:
 *   pnpm course:generate-content                         all lessons missing any field
 *   pnpm course:generate-content --module 3              one module
 *   pnpm course:generate-content --slug barber-lesson-8  one lesson
 *   pnpm course:generate-content --force                 regenerate everything
 *   pnpm course:generate-content --content-only          only lesson body text
 *   pnpm course:generate-content --quiz-only             only quiz questions
 *   pnpm course:generate-content --dry-run               show plan, no API calls
 *
 * After running:
 *   pnpm course:validate
 *   pnpm tsx scripts/apply-barber-content.ts
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
config({ path: path.resolve(process.cwd(), '.env.local') });

import OpenAI from 'openai';
import { barberCourse } from './seeds/barber-course.seed';
import type { LessonSeed, CheckpointSeed } from '../../lib/curriculum/course-builder-types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DRY_RUN       = process.argv.includes('--dry-run');
const FORCE         = process.argv.includes('--force');
const CONTENT_ONLY  = process.argv.includes('--content-only');
const QUIZ_ONLY     = process.argv.includes('--quiz-only');
const MODULE_FILTER = (() => { const i = process.argv.indexOf('--module'); return i !== -1 ? parseInt(process.argv[i + 1]) : null; })();
const SLUG_FILTER   = (() => { const i = process.argv.indexOf('--slug');   return i !== -1 ? process.argv[i + 1] : null; })();

const MIN_CONTENT_WORDS  = 800;
const MIN_QUIZ_QUESTIONS = 20;
const MIN_FLASHCARDS     = 15;
const MIN_SCENARIO_Q     = 8;

const QUESTION_OVERRIDES: Record<string, number> = {
  'barber-indiana-state-board-exam': 60,
};

const DOMAIN_WEIGHTS: Record<string, string> = {
  SAFETY_SANITATION:     '25% of Indiana barber written exam',
  HAIR_SCALP:            '20% of Indiana barber written exam',
  HAIRCUTTING:           '25% of Indiana barber written exam',
  CHEMICAL_SERVICES:     '15% of Indiana barber written exam',
  TOOLS_EQUIPMENT:       'subset of haircutting domain',
  SHAVING:               'practical exam component',
  BUSINESS_PROFESSIONAL: 'professional skills',
  STATE_BOARD_PREP:      'exam preparation — covers all domains',
};

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildContentPrompt(lesson: LessonSeed): string {
  return `You are writing instructional content for a DOL-registered barber apprenticeship program in Indiana.
This is the reading/study material displayed in the LMS for this lesson.

LESSON: "${lesson.title}"
DOMAIN: ${lesson.domain} (${DOMAIN_WEIGHTS[lesson.domain] ?? ''})
${lesson.miladyChapter ? `MILADY REFERENCE: ${lesson.miladyChapter}` : ''}

COMPETENCY CHECKS (students must demonstrate):
${lesson.competencyChecks.map(c => `- ${c.description}`).join('\n')}

Write a complete lesson body of 900–1,100 words. Requirements:
- Open with 2–3 sentences explaining why this topic matters to a working barber in Indiana
- Use ## H2 headings to organize 4–6 major sections
- Each section: 2–4 paragraphs of substantive instructional content
- Include at least one numbered step-by-step procedure relevant to this lesson
- Include Indiana state board exam relevance (what % of exam, what they test on this topic)
- Professional but accessible language — trade apprenticeship, not a college course
- End with a 2–3 sentence "Key Takeaway" paragraph
- Use prose paragraphs as the primary structure, not bullet lists
- Do NOT include quiz questions or flashcards

Return ONLY the lesson text in markdown. No JSON. No preamble.`;
}

function buildQuizPrompt(lesson: LessonSeed, content: string): string {
  return `You are writing quiz questions for a DOL-registered barber apprenticeship program in Indiana.
Questions must prepare students for the Indiana state board written exam.

LESSON: "${lesson.title}"
DOMAIN: ${lesson.domain} (${DOMAIN_WEIGHTS[lesson.domain] ?? ''})
CONTENT:
${content}

COMPETENCY CHECKS:
${lesson.competencyChecks.map(c => `- ${c.description}`).join('\n')}

Generate exactly 20 multiple-choice quiz questions.

REQUIRED MIX — you must hit these counts exactly:
- 8 factual recall questions (definitions, rules, facts from the content)
- 8 scenario questions (describe a real barbershop situation, ask what the barber should do)
- 4 applied judgment questions ("what would you do if..." or "which is the BEST approach")

Each question:
- Exactly 4 answer choices
- One correct answer
- Rationale: 1–2 sentences explaining WHY the correct answer is right
- Scenario questions MUST start with a situation: "A client presents with...", "During a service you notice...", "A new client asks...", etc.
- Do NOT repeat the same concept twice
- Do NOT use "all of the above" or "none of the above"

Return ONLY valid JSON — no markdown:
[{ "prompt": "...", "choices": ["A","B","C","D"], "answerIndex": 0, "rationale": "...", "type": "recall|scenario|applied" }]`;
}

function buildFlashcardPrompt(lesson: LessonSeed, content: string): string {
  return `You are writing flashcards for a DOL-registered barber apprenticeship program in Indiana.

LESSON: "${lesson.title}"
DOMAIN: ${lesson.domain}
CONTENT:
${content}

Generate exactly 15 flashcard term/definition pairs.
- Terms: key vocabulary, concepts, procedures, rules, anatomy terms, chemical names
- Definitions: concise (1–2 sentences), accurate, student-friendly
- Cover the most important state-board-testable concepts
- Do NOT include trivial or obvious terms

Return ONLY valid JSON — no markdown:
[{ "term": "...", "definition": "..." }]`;
}

function buildProcedurePrompt(lesson: LessonSeed, content: string): string {
  return `You are writing a step-by-step procedure for a barber apprenticeship lab lesson.

LESSON: "${lesson.title}"
CONTENT:
${content}

Write the primary hands-on procedure for this lesson as numbered steps.
- 8–15 steps
- Each step: clear, actionable instruction (1–2 sentences)
- Include safety/sanitation notes where critical (e.g. "SAFETY: Disinfect before use")
- Steps must be in correct professional sequence
- Match Indiana state board practical exam standards

Return ONLY valid JSON — no markdown:
[{ "step": 1, "instruction": "...", "safetyNote": "optional safety note or null" }]`;
}

function buildCheckpointQuizPrompt(cp: CheckpointSeed, moduleTitle: string, count: number): string {
  const isFinalExam = cp.slug === 'barber-indiana-state-board-exam';
  const context = isFinalExam
    ? `This is the PROGRAM FINAL EXAM covering all 8 modules of the Indiana barber apprenticeship.
Mirror the Indiana state board written exam in structure and difficulty.
Distribute questions:
  - Infection Control & Sanitation: 15q (25%)
  - Hair Science & Scalp Analysis: 12q (20%)
  - Haircutting & Styling: 15q (25%)
  - Chemical Services: 9q (15%)
  - Indiana Laws & Regulations: 9q (15%)`
    : `This checkpoint covers the entire module and gates progression to the next.
MODULE: "${moduleTitle}"
It must be harder than individual lesson quizzes.`;

  return `You are writing checkpoint quiz questions for a DOL-registered barber apprenticeship program in Indiana.

${context}
CHECKPOINT: "${cp.title}"
DOMAIN: ${cp.domain} (${DOMAIN_WEIGHTS[cp.domain] ?? ''})
PASSING SCORE: ${cp.passingScore}%

Generate exactly ${count} multiple-choice questions.
- At least 50% must be scenario-based (real barbershop situations)
- Cover all key topics in the module/program — not just one area
- Harder than individual lesson quizzes — this is a gate
- Exactly 4 choices, one correct answer, rationale per question
- Do NOT repeat the same concept twice
- Do NOT use "all of the above" or "none of the above"

Return ONLY valid JSON — no markdown:
[{ "prompt": "...", "choices": ["A","B","C","D"], "answerIndex": 0, "rationale": "..." }]`;
}

// ── GPT callers ───────────────────────────────────────────────────────────────

async function callGPTText(prompt: string, label: string): Promise<string> {
  process.stdout.write(`    GPT-4o → ${label} ... `);
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o', temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? '';
    const words = text.split(/\s+/).length;
    console.log(`${words}w`);
    return text;
  } catch (err) { console.log(`FAILED: ${err}`); return ''; }
}

async function callGPTJSON(prompt: string, label: string): Promise<unknown[]> {
  process.stdout.write(`    GPT-4o → ${label} ... `);
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o', temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? '';
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    console.log(`${parsed.length} items`);
    return parsed;
  } catch (err) { console.log(`FAILED: ${err}`); return []; }
}

async function callGPTJSONWithTopUp(prompt: string, label: string, target: number): Promise<unknown[]> {
  let results = await callGPTJSON(prompt, label);
  if (!results.length) return [];
  let attempts = 0;
  while (results.length < target && attempts < 3) {
    const missing = target - results.length;
    const topUp = prompt.replace(/Generate exactly \d+/, `Generate exactly ${missing} additional`);
    const extra = await callGPTJSON(topUp + `\n\nDo NOT repeat: ${(results as Array<{prompt?:string}>).slice(0,5).map(q=>q.prompt).join(' | ')}`, `${label} top-up`);
    if (!extra.length) break;
    results = [...results, ...extra];
    attempts++;
  }
  return results.slice(0, target);
}

// ── Sidecar helpers ───────────────────────────────────────────────────────────

const SIDECAR_DIR = path.resolve(process.cwd(), 'scripts/course-builder/seeds/content');

function loadSidecar(slug: string): Record<string, unknown> {
  const p = path.join(SIDECAR_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function writeSidecar(slug: string, data: Record<string, unknown>): void {
  fs.mkdirSync(SIDECAR_DIR, { recursive: true });
  const existing = loadSidecar(slug);
  fs.writeFileSync(path.join(SIDECAR_DIR, `${slug}.json`), JSON.stringify({ ...existing, ...data }, null, 2));
}

function sidecarWordCount(slug: string): number {
  const s = loadSidecar(slug);
  return typeof s.content === 'string' ? s.content.trim().split(/\s+/).length : 0;
}

function sidecarQuizCount(slug: string): number {
  const s = loadSidecar(slug);
  return ((s.quiz as {questions?:unknown[]})?.questions?.length) ?? 0;
}

function sidecarFlashcardCount(slug: string): number {
  return ((loadSidecar(slug).flashcards as unknown[])?.length) ?? 0;
}

function countScenarioQuestions(questions: unknown[]): number {
  return (questions as Array<Record<string,unknown>>).filter(q => {
    const p = String(q.prompt ?? q.question ?? '').toLowerCase();
    const t = String(q.type ?? '').toLowerCase();
    return t === 'scenario' || t === 'applied' ||
      p.startsWith('a client') || p.startsWith('during a') || p.startsWith('a new client') ||
      p.startsWith('you notice') || p.startsWith('while performing') || p.includes('presents with');
  }).length;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let processed = 0, skipped = 0, failed = 0;

  for (const mod of barberCourse.modules) {
    if (MODULE_FILTER !== null && mod.order !== MODULE_FILTER) continue;
    console.log(`\n── Module ${mod.order}: ${mod.title}`);

    for (const lesson of mod.lessons) {
      if (SLUG_FILTER && lesson.slug !== SLUG_FILTER) continue;

      // Determine what's needed
      const seedWords   = lesson.content?.trim().split(/\s+/).length ?? 0;
      const existingWords = Math.max(seedWords, sidecarWordCount(lesson.slug));
      const existingQ   = lesson.quiz?.questions?.length  ?? sidecarQuizCount(lesson.slug);
      const existingFC  = lesson.flashcards?.length       ?? sidecarFlashcardCount(lesson.slug);

      const needsContent    = !QUIZ_ONLY  && (FORCE || existingWords < MIN_CONTENT_WORDS);
      const needsQuiz       = !CONTENT_ONLY && (FORCE || existingQ < MIN_QUIZ_QUESTIONS);
      const needsFlashcards = !CONTENT_ONLY && (FORCE || existingFC < MIN_FLASHCARDS);
      const isLab = ['lab', 'practical'].includes(lesson.ojtCategory?.toLowerCase() ?? '');
      const needsProcedures = !CONTENT_ONLY && !QUIZ_ONLY && isLab &&
        !loadSidecar(lesson.slug).procedures;

      if (!needsContent && !needsQuiz && !needsFlashcards && !needsProcedures) {
        console.log(`  ✅ ${lesson.slug} (${existingWords}w, ${existingQ}q, ${existingFC}fc)`);
        skipped++; continue;
      }

      const missing = [
        needsContent    ? `content(${existingWords}w→${MIN_CONTENT_WORDS}w)` : '',
        needsQuiz       ? `quiz(${existingQ}→${MIN_QUIZ_QUESTIONS}q)` : '',
        needsFlashcards ? `flashcards(${existingFC}→${MIN_FLASHCARDS}fc)` : '',
        needsProcedures ? 'procedures' : '',
      ].filter(Boolean).join(', ');
      console.log(`  → ${lesson.slug} — needs: ${missing}`);

      if (DRY_RUN) { processed++; continue; }

      const sidecarData: Record<string, unknown> = {};

      // 1. Content
      let contentToUse = existingWords >= MIN_CONTENT_WORDS
        ? (loadSidecar(lesson.slug).content as string ?? lesson.content)
        : '';

      if (needsContent) {
        const text = await callGPTText(buildContentPrompt(lesson), 'content');
        if (!text) { failed++; continue; }
        const words = text.trim().split(/\s+/).length;
        if (words < MIN_CONTENT_WORDS) {
          console.log(`    ⚠️  Only ${words}w — re-requesting`);
          const retry = await callGPTText(buildContentPrompt(lesson) + '\n\nIMPORTANT: You MUST write at least 900 words. Previous attempt was too short.', 'content retry');
          if (!retry) { failed++; continue; }
          sidecarData.content = retry;
          contentToUse = retry;
        } else {
          sidecarData.content = text;
          contentToUse = text;
        }
      }

      // 2. Quiz (uses content for better questions)
      if (needsQuiz) {
        const sourceContent = contentToUse || lesson.content;
        let quiz = await callGPTJSONWithTopUp(buildQuizPrompt(lesson, sourceContent), 'quiz', MIN_QUIZ_QUESTIONS);
        if (!quiz.length) { failed++; continue; }
        // Enforce scenario count
        const scenarioCount = countScenarioQuestions(quiz);
        if (scenarioCount < MIN_SCENARIO_Q) {
          console.log(`    ⚠️  Only ${scenarioCount} scenario questions — requesting more`);
          const scenarioPrompt = buildQuizPrompt(lesson, sourceContent).replace(
            '- 8 scenario questions',
            `- ${MIN_SCENARIO_Q - scenarioCount} MORE scenario questions (already have ${scenarioCount})`
          );
          const extra = await callGPTJSONWithTopUp(scenarioPrompt, 'scenario top-up', MIN_SCENARIO_Q - scenarioCount);
          quiz = [...quiz, ...extra].slice(0, MIN_QUIZ_QUESTIONS + extra.length);
        }
        sidecarData.quiz = { passingScore: 70, questions: quiz };
      }

      // 3. Flashcards
      if (needsFlashcards) {
        const sourceContent = contentToUse || lesson.content;
        const flashcards = await callGPTJSONWithTopUp(buildFlashcardPrompt(lesson, sourceContent), 'flashcards', MIN_FLASHCARDS);
        if (!flashcards.length) { failed++; continue; }
        sidecarData.flashcards = flashcards;
      }

      // 4. Procedures (lab lessons)
      if (needsProcedures) {
        const sourceContent = contentToUse || lesson.content;
        const procedures = await callGPTJSON(buildProcedurePrompt(lesson, sourceContent), 'procedures');
        if (procedures.length) sidecarData.procedures = procedures;
      }

      writeSidecar(lesson.slug, sidecarData);
      console.log(`    ✅ Sidecar written`);
      processed++;
    }

    // Checkpoint
    if (mod.checkpoint) {
      const cp = mod.checkpoint;
      if (SLUG_FILTER && cp.slug !== SLUG_FILTER) continue;
      if (CONTENT_ONLY) continue;

      const requiredCount = QUESTION_OVERRIDES[cp.slug] ?? MIN_QUIZ_QUESTIONS;
      const existingCpQ   = cp.questions?.length ?? sidecarQuizCount(cp.slug);
      const needsQuiz     = FORCE || existingCpQ < requiredCount;

      if (!needsQuiz) {
        console.log(`  ✅ ${cp.slug} (${existingCpQ}q)`);
        skipped++; continue;
      }

      console.log(`  → ${cp.slug} — needs: quiz(${existingCpQ}→${requiredCount}q)`);
      if (DRY_RUN) { processed++; continue; }

      const quiz = await callGPTJSONWithTopUp(
        buildCheckpointQuizPrompt(cp, mod.title, requiredCount),
        'checkpoint quiz', requiredCount
      );
      if (!quiz.length) { failed++; continue; }

      writeSidecar(cp.slug, { quiz: { passingScore: cp.passingScore, questions: quiz } });
      console.log(`    ✅ Sidecar written`);
      processed++;
    }
  }

  console.log(`\n── Done: processed=${processed}  skipped=${skipped}  failed=${failed}`);
  if (failed > 0) { console.log('Re-run to retry failed lessons.'); process.exit(1); }
  if (!DRY_RUN && processed > 0) {
    console.log('\nNext: pnpm course:validate && pnpm tsx scripts/apply-barber-content.ts');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
