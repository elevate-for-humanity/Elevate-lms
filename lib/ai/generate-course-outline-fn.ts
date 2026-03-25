/**
 * generateCourseOutlineFn — core generation function with 3-attempt retry.
 *
 * GPT-4o → normalize → validate → return outline.
 * Called by the orchestrator route. Not the old fake route.
 *
 * Retry schedule:
 *   Attempt 1: temperature 0.3
 *   Attempt 2: temperature 0.5
 *   Attempt 3: temperature 0.4
 */

import { getOpenAIClient } from '@/lib/openai-client';
import { validateCourseOutline, type CourseOutlinePayload } from '@/lib/ai/course-outline-schema';
import { normalizeCourseOutline, type NormalizationLog } from '@/lib/ai/course-outline-normalizer';
import { buildIndianaCompliancePromptFragment } from '@/lib/ai/indiana-compliance-map';

const MAX_ATTEMPTS = 3;
const TEMPERATURES = [0.3, 0.5, 0.4];

export interface GenerateSuccess {
  ok: true;
  outline: CourseOutlinePayload;
  attempt: number;
  normalization: NormalizationLog;
}

export interface GenerateFailure {
  ok: false;
  attempts: number;
  errors_per_attempt: string[][];
}

export type GenerateResult = GenerateSuccess | GenerateFailure;

function buildSystemPrompt(prompt: string): string {
  const lower = prompt.toLowerCase();
  const isIndianaCNA =
    (lower.includes('cna') || lower.includes('nursing assistant')) &&
    (lower.includes('indiana') || lower.includes('natcep'));

  const complianceFragment = isIndianaCNA
    ? `\n\n${buildIndianaCompliancePromptFragment()}`
    : '';

  return `You are a curriculum architect for a workforce training LMS. Output ONLY valid JSON — no markdown, no prose, no code fences.

Schema:
{
  "course": {
    "title": string, "slug": string, "description": string, "total_hours": number,
    "state": string, "credential": string,
    "pass_threshold_checkpoints": number, "pass_threshold_final_exam": number,
    "exam_eligibility_criteria": string[],
    "compliance_status": "draft_for_human_review"
  },
  "modules": [{ "module_index": number, "slug": string, "title": string, "description": string }],
  "lessons": [{
    "order_index": number, "module_index": number, "slug": string, "title": string,
    "step_type": "lesson"|"checkpoint"|"exam",
    "learning_points": string[], "scenario": string,
    "assessment_question": {
      "question": string,
      "choices": {"a":string,"b":string,"c":string,"d":string},
      "correct": "a"|"b"|"c"|"d", "rationale": string
    }
  }],
  "checkpoints": [{ "after_module_index": number, "slug": string, "title": string, "pass_threshold": number, "competencies_tested": string[] }],
  "exams": [{ "slug": string, "title": string, "question_count": number, "pass_threshold": number, "domain_blueprint": [{ "domain": string, "question_count": number, "competencies": string[] }] }]
}

HARD RULES — any violation causes rejection and retry:
1. Exactly 5 modules (module_index 1–5).
2. step_type: ONLY "lesson", "checkpoint", or "exam". Never "lecture", "video", "reading".
3. Every module: EXACTLY 4 rows with step_type="lesson". 20 lesson rows total.
4. Checkpoints: EXACTLY 3, after modules 2, 3, 4 only. module_index matches the module they close.
5. Exam: EXACTLY 1 row, step_type="exam", module_index=5, last row in array.
6. Total lessons array = 24 rows (20+3+1). order_index 1–24, no gaps, no duplicates.
7. Slugs: unique, lowercase, hyphens only, no spaces or underscores.
8. Exam: question_count>=25, domain_blueprint required.
9. compliance_status = "draft_for_human_review" always.
10. No placeholders, no TBD, no filler. All content specific and job-ready.
11. Every lesson row: learning_points must have AT LEAST 3 items, each at least 10 characters. Write 4–5 points per lesson.
12. Every lesson row: scenario must be AT LEAST 40 characters — a full sentence describing a real workplace situation.

Structure (follow exactly):
  1-4:   module 1, lesson x4
  5-8:   module 2, lesson x4
  9:     module 2, checkpoint
  10-13: module 3, lesson x4
  14:    module 3, checkpoint
  15-18: module 4, lesson x4
  19:    module 4, checkpoint
  20-23: module 5, lesson x4
  24:    module 5, exam${complianceFragment}`;
}

export async function generateCourseOutlineFn(prompt: string): Promise<GenerateResult> {
  const openai = getOpenAIClient();
  const systemPrompt = buildSystemPrompt(prompt);
  const errorsPerAttempt: string[][] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Call GPT-4o
    let raw = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: TEMPERATURES[attempt - 1],
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      });
      raw = completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      errorsPerAttempt.push([`OpenAI call failed: ${err instanceof Error ? err.message : String(err)}`]);
      continue;
    }

    // Parse
    let parsed: unknown = null;
    try { parsed = JSON.parse(raw); } catch {
      errorsPerAttempt.push(['Model returned malformed JSON']);
      continue;
    }

    // Normalize
    const { normalized, log } = normalizeCourseOutline(parsed);

    // Force compliance_status before validation
    if (normalized && typeof normalized === 'object' && !Array.isArray(normalized)) {
      const n = normalized as Record<string, unknown>;
      if (n.course && typeof n.course === 'object') {
        (n.course as Record<string, unknown>).compliance_status = 'draft_for_human_review';
      }
    }

    // Validate
    const validation = validateCourseOutline(normalized);
    if (validation.valid) {
      return { ok: true, outline: normalized as CourseOutlinePayload, attempt, normalization: log };
    }

    errorsPerAttempt.push(validation.errors);
  }

  return { ok: false, attempts: MAX_ATTEMPTS, errors_per_attempt: errorsPerAttempt };
}
