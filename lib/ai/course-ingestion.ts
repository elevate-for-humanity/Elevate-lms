/**
 * AI Course Ingestion Pipeline
 *
 * Converts a prompt, syllabus, script, or source document into a structured
 * draft course blueprint. Pipeline: classify → extract → normalize → validate.
 *
 * The caller persists the blueprint. Nothing auto-publishes.
 *
 * Schema alignment notes (verified against live DB 2025-03):
 *   training_courses  → UUID PK
 *   course_modules    → UUID PK, course_id UUID
 *   training_lessons  → UUID PK, course_id UUID, module_id UUID, quiz_questions JSONB
 *   quizzes / quiz_questions / quiz_answer_options → integer PKs, incompatible with UUID stack
 *   Quiz data is stored in training_courses.metadata JSONB to avoid the integer/UUID mismatch.
 */

import { getOpenAIClient } from '@/lib/openai-client';
import { compileAllLessons } from '@/lib/ai/lesson-compiler';
import type { CompiledLesson } from '@/lib/ai/lesson-compiler';

export type SourceType = 'prompt' | 'syllabus' | 'script' | 'transcript' | 'document';

export interface IngestInput {
  source_type: SourceType;
  source_text: string;
  course_mode: 'standalone' | 'program-linked';
  program_id?: string | null;
  certificate_enabled?: boolean;
  /** Run lesson compiler second pass to generate narration, slides, quiz bank per lesson */
  compile_lessons?: boolean;
}

export interface QuizQuestionBlueprint {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  points: number;
}

export interface LessonBlueprint {
  title: string;
  description: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  content_type: 'text' | 'video' | 'mixed';
  // Compiled assets — populated by lesson-compiler second pass
  compiled?: CompiledLesson;
}

export interface ModuleBlueprint {
  title: string;
  description: string;
  order_index: number;
  lessons: LessonBlueprint[];
}

export interface CourseBlueprint {
  detected_source_type: SourceType;
  title: string;
  subtitle: string;
  description: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_hours: number;
  category: string;
  target_audience: string;
  learning_objectives: string[];
  modules: ModuleBlueprint[];
  quiz_title: string;
  quiz_passing_score: number;
  quiz_questions: QuizQuestionBlueprint[];
  certificate_enabled: boolean;
  certificate_title: string;
  passing_score: number;
  completion_criteria: string;
  warnings: string[];
}

// ── House rules injected into every generation ────────────────────────────────
const HOUSE_RULES = `
HOUSE RULES (always apply):
- Default lesson length: 15-30 minutes
- Tone: professional, direct, accessible — no jargon without explanation
- Every module must have at least 2 lessons
- Quiz: 5-10 questions per course, multiple choice preferred
- Certificate language: "Certificate of Completion — [Course Title] — Elevate for Humanity"
- Accessibility: lesson descriptions must be screen-reader friendly (no "click here")
- Naming: Title Case for course/module/lesson titles
- Compliance: tag workforce-development courses with relevant funding streams (WIOA, DOL, JRI) where applicable
- Never generate more than 8 modules or more than 6 lessons per module
- Always output valid JSON — no markdown fences, no trailing commas
`.trim();

// ── Prompts ───────────────────────────────────────────────────────────────────
const CLASSIFICATION_PROMPT = (text: string) => `
Classify the following text as exactly one of:
- "prompt" — natural language description of a course to build
- "syllabus" — structured syllabus with weeks/units/objectives
- "script" — video script or narration draft
- "transcript" — transcript of a recorded lecture or presentation
- "document" — policy manual, standards doc, compliance guide, or reference material

Return ONLY JSON: {"source_type": "<type>", "confidence": <0-1>, "reason": "<one sentence>"}

TEXT (first 2000 chars):
${text.slice(0, 2000)}
`.trim();

const EXTRACTION_PROMPT = (sourceType: SourceType, text: string) => `
You are an AI course compiler for Elevate for Humanity, a workforce development training platform.

${HOUSE_RULES}

INPUT TYPE: ${sourceType}
SOURCE TEXT:
---
${text}
---

Extract and generate a complete course blueprint.

For "prompt": invent the full structure from stated intent.
For "syllabus": map existing structure directly to modules/lessons.
For "script" or "transcript": chunk content into logical lessons, infer module groupings.
For "document": extract key topics as lessons, group by theme into modules.

Return ONLY valid JSON (no markdown, no trailing commas):

{
  "title": "Course Title",
  "subtitle": "One-line subtitle",
  "description": "2-3 sentence course description",
  "skill_level": "beginner|intermediate|advanced",
  "estimated_duration_hours": 0,
  "category": "Healthcare|Trades|Technology|Business|Tax Preparation|Other",
  "target_audience": "Who this course is for",
  "learning_objectives": ["objective 1", "objective 2", "objective 3"],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "order_index": 0,
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description (screen-reader friendly, no click here)",
          "content": "Draft lesson body — 2-4 paragraphs of instructional content",
          "order_index": 0,
          "duration_minutes": 20,
          "content_type": "text"
        }
      ]
    }
  ],
  "quiz_title": "Course Assessment",
  "quiz_passing_score": 70,
  "quiz_questions": [
    {
      "question_text": "Question?",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "points": 1
    }
  ],
  "certificate_enabled": true,
  "certificate_title": "Certificate of Completion — [Course Title] — Elevate for Humanity",
  "passing_score": 70,
  "completion_criteria": "Complete all lessons and pass the final assessment with 70% or higher",
  "warnings": []
}

RULES:
- warnings: list anything ambiguous, missing, or needing human review
- quiz_questions: 5-10 questions covering the whole course
- estimated_duration_hours: sum of all lesson durations / 60, rounded to nearest 0.5
- Every module needs at least 2 lessons
- Max 8 modules, max 6 lessons per module
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseJSON(raw: string): any {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function chunkText(text: string, maxChars = 12000): string[] {
  if (text.length <= maxChars) return [text];
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateAndWarn(blueprint: CourseBlueprint): void {
  const warnings = blueprint.warnings || [];

  if (!blueprint.title?.trim()) {
    warnings.push('No course title detected. Add a title before publishing.');
  }
  if (!blueprint.learning_objectives?.length || blueprint.learning_objectives.length < 2) {
    warnings.push('Fewer than 2 learning objectives detected. Add specific objectives before publishing.');
  }
  if (!blueprint.modules?.length) {
    warnings.push('No modules were detected. Review the course structure before saving.');
  }

  const allLessonTitles: string[] = [];
  blueprint.modules?.forEach((mod, mi) => {
    if (!mod.title?.trim()) warnings.push(`Module ${mi + 1} has no title.`);
    if (!mod.lessons?.length || mod.lessons.length < 2) {
      warnings.push(`Module ${mi + 1} "${mod.title}" has fewer than 2 lessons.`);
    }
    mod.lessons?.forEach((lesson, li) => {
      if (!lesson.title?.trim()) warnings.push(`Module ${mi + 1}, Lesson ${li + 1} has no title.`);
      if ((lesson.duration_minutes || 0) < 5) {
        warnings.push(`Lesson "${lesson.title}" is very short (${lesson.duration_minutes || 0} min). Review content.`);
      }
      if ((lesson.content?.length || 0) < 50) {
        warnings.push(`Lesson "${lesson.title}" has minimal content. Expand before publishing.`);
      }
      if (allLessonTitles.includes(lesson.title)) {
        warnings.push(`Duplicate lesson title: "${lesson.title}".`);
      }
      allLessonTitles.push(lesson.title);
    });
  });

  blueprint.quiz_questions?.forEach((q, qi) => {
    if (!q.question_text?.trim()) warnings.push(`Quiz question ${qi + 1} has no text.`);
    if (!q.options?.length || q.options.length < 2) {
      warnings.push(`Quiz question ${qi + 1} has fewer than 2 answer options.`);
    }
    if (!q.correct_answer?.trim()) {
      warnings.push(`Quiz question ${qi + 1} has no correct answer set.`);
    } else if (q.options?.length && !q.options.includes(q.correct_answer)) {
      warnings.push(`Quiz question ${qi + 1}: correct answer not found in options list.`);
    }
  });

  if (!blueprint.quiz_questions?.length) {
    warnings.push('No quiz questions were generated. Add questions before publishing.');
  }

  blueprint.warnings = [...new Set(warnings)];
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function ingestCourse(input: IngestInput): Promise<CourseBlueprint> {
  const openai = getOpenAIClient();

  if (input.source_text.length > 80000) {
    throw new Error('source_text exceeds 80,000 character limit. Split the document and ingest in sections.');
  }

  // Step 1: classify (re-classify documents to catch misidentified types)
  let detectedType = input.source_type;
  if (input.source_type === 'document') {
    try {
      const classRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: CLASSIFICATION_PROMPT(input.source_text) }],
        temperature: 0,
        max_tokens: 120,
      });
      const raw = classRes.choices[0].message.content || '{}';
      const parsed = parseJSON(raw);
      if (parsed.confidence > 0.75 && parsed.source_type) {
        detectedType = parsed.source_type as SourceType;
      }
    } catch {
      // non-fatal — proceed with stated type
    }
  }

  // Step 2: for large inputs, summarize chunks first
  let extractionText = input.source_text;
  if (input.source_text.length > 14000) {
    const chunks = chunkText(input.source_text, 12000);
    if (chunks.length > 1) {
      const summaries: string[] = [];
      for (const chunk of chunks.slice(0, 5)) {
        try {
          const sumRes = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Summarize the key topics, structure, and learning content from this section. Preserve all topic names, objectives, and section headings.\n\n${chunk}`,
            }],
            temperature: 0.2,
            max_tokens: 1500,
          });
          summaries.push(sumRes.choices[0].message.content || '');
        } catch {
          summaries.push(chunk.slice(0, 2000));
        }
      }
      extractionText = summaries.join('\n\n---\n\n');
    }
  }

  // Step 3: extract + normalize
  const extractRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert instructional designer and course architect. Output only valid JSON.',
      },
      {
        role: 'user',
        content: EXTRACTION_PROMPT(detectedType, extractionText),
      },
    ],
    temperature: 0.4,
    max_tokens: 8000,
  });

  const raw = extractRes.choices[0].message.content;
  if (!raw) throw new Error('No response from AI');

  let blueprint: CourseBlueprint;
  try {
    blueprint = parseJSON(raw) as CourseBlueprint;
  } catch {
    throw new Error('AI returned malformed JSON. Try rephrasing your input or using a shorter document.');
  }

  blueprint.detected_source_type = detectedType;

  // Apply house rule defaults
  if (!blueprint.certificate_title || blueprint.certificate_title.includes('[Course Title]')) {
    blueprint.certificate_title = `Certificate of Completion — ${blueprint.title} — Elevate for Humanity`;
  }
  if (!blueprint.passing_score) blueprint.passing_score = 70;
  if (!blueprint.quiz_passing_score) blueprint.quiz_passing_score = 70;
  if (!Array.isArray(blueprint.warnings)) blueprint.warnings = [];

  // Normalize order_index on all modules and lessons
  blueprint.modules = (blueprint.modules || []).map((mod, mi) => ({
    ...mod,
    order_index: mod.order_index ?? mi,
    lessons: (mod.lessons || []).map((lesson, li) => ({
      ...lesson,
      order_index: lesson.order_index ?? li,
      duration_minutes: lesson.duration_minutes || 20,
      content_type: lesson.content_type || 'text',
    })),
  }));

  // Step 4: validate and populate warnings
  validateAndWarn(blueprint);

  // Step 5 (optional): lesson compiler second pass
  // Generates narration script, slide outline, examples, and per-lesson quiz bank.
  // Skipped when compile_lessons is false (e.g. preview_only calls).
  if (input.compile_lessons) {
    try {
      const compiled = await compileAllLessons({
        courseTitle:       blueprint.title,
        courseDescription: blueprint.description || '',
        audience:          blueprint.target_audience
          ? [blueprint.target_audience]
          : ['adult workforce learners'],
        difficulty: (blueprint.skill_level as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        modules: blueprint.modules.map((m, mi) => ({
          module_title:      m.title,
          module_order:      mi + 1,
          module_objectives: [],
          lessons: m.lessons.map((l, li) => ({
            lesson_title:      l.title,
            lesson_order:      li + 1,
            lesson_objectives: [],
            lesson_summary:    l.description || l.content?.slice(0, 200) || '',
          })),
        })),
      });

      // Attach compiled assets to each lesson
      // compiled is CompiledModule[] — index by module/lesson position
      let compiledCount = 0;
      blueprint.modules = blueprint.modules.map((mod, mi) => {
        const compiledMod = compiled[mi];
        return {
          ...mod,
          lessons: mod.lessons.map((lesson, li) => {
            const assets = compiledMod?.lessons[li];
            if (assets) {
              compiledCount++;
              return {
                ...lesson,
                duration_minutes: assets.estimated_minutes || lesson.duration_minutes,
                compiled: assets,
              };
            }
            return lesson;
          }),
        };
      });

      // Recalculate total duration from compiled estimates
      const totalMinutes = blueprint.modules
        .flatMap((m) => m.lessons)
        .reduce((sum, l) => sum + (l.duration_minutes || 20), 0);
      blueprint.estimated_duration_hours = Math.round((totalMinutes / 60) * 2) / 2;

      if (compiledCount === 0) {
        blueprint.warnings.push('Lesson compilation ran but produced no output. Lessons contain structure only.');
      } else {
        const totalLessons = blueprint.modules.flatMap((m) => m.lessons).length;
        if (compiledCount < totalLessons) {
          blueprint.warnings.push(
            `${totalLessons - compiledCount} of ${totalLessons} lessons could not be fully compiled. Review those lessons before publishing.`
          );
        }
      }
    } catch {
      // Compilation failure is non-fatal — blueprint still usable as structure
      blueprint.warnings.push('Lesson compilation encountered an error. Course structure is intact; lesson content may need manual expansion.');
    }
  }

  return blueprint;
}
