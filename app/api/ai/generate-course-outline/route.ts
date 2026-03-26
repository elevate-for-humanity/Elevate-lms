import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getOpenAIClient } from '@/lib/openai-client';
import { validateCourseOutline } from '@/lib/ai/course-outline-schema';
import { normalizeCourseOutline } from '@/lib/ai/course-outline-normalizer';
import { buildIndianaCompliancePromptFragment } from '@/lib/ai/indiana-compliance-map';

export const maxDuration = 300;

// ---------------------------------------------------------------------------
// System prompt — schema contract + compliance injection
// ---------------------------------------------------------------------------
function buildSystemPrompt(userPrompt: string): string {
  const lower = userPrompt.toLowerCase();
  const isIndianaCNA =
    (lower.includes('cna') || lower.includes('nursing assistant')) &&
    (lower.includes('indiana') || lower.includes('natcep'));

  const complianceFragment = isIndianaCNA
    ? `\n\n${buildIndianaCompliancePromptFragment()}`
    : '';

  return `You are a curriculum architect for a workforce training LMS. You output ONLY valid JSON — no markdown, no explanation, no code fences. The JSON must exactly match this schema:

{
  "course": {
    "title": string,
    "slug": string,
    "description": string,
    "total_hours": number,
    "state": string,
    "credential": string,
    "pass_threshold_checkpoints": number,
    "pass_threshold_final_exam": number,
    "exam_eligibility_criteria": string[],
    "compliance_status": "draft_for_human_review"
  },
  "modules": [{ "module_index": number, "slug": string, "title": string, "description": string }],
  "lessons": [{
    "order_index": number,
    "module_index": number,
    "slug": string,
    "title": string,
    "step_type": "lesson" | "checkpoint" | "exam",
    "learning_points": string[],
    "scenario": string,
    "assessment_question": {
      "question": string,
      "choices": { "a": string, "b": string, "c": string, "d": string },
      "correct": "a" | "b" | "c" | "d",
      "rationale": string
    }
  }],
  "checkpoints": [{ "after_module_index": number, "slug": string, "title": string, "pass_threshold": number, "competencies_tested": string[] }],
  "exams": [{ "slug": string, "title": string, "question_count": number, "pass_threshold": number, "domain_blueprint": [{ "domain": string, "question_count": number, "competencies": string[] }] }]
}

HARD RULES — violating any causes rejection:
1. Exactly 5 modules (module_index 1 through 5).
2. step_type values: use ONLY "lesson", "checkpoint", or "exam". Never "lecture", "video", "reading", or anything else.
3. EVERY module must have EXACTLY 4 lesson rows (step_type = "lesson") in the lessons array. Not 3, not 5 — exactly 4 per module. That is 20 lesson rows total across 5 modules.
4. Checkpoints (step_type = "checkpoint") go ONLY after modules 2, 3, and 4. Module 1 has NO checkpoint. Module 5 has NO checkpoint. Exactly 3 checkpoint rows total.
5. The exam (step_type = "exam") is a SINGLE row at the very end of the lessons array, with module_index = 5.
6. Total lessons array size = 20 lesson rows + 3 checkpoint rows + 1 exam row = 24 rows exactly.
7. order_index: number every row 1 through 24 sequentially with no gaps and no duplicates.
8. All slugs unique and slug-safe: lowercase letters, numbers, hyphens only.
9. Final exam question_count >= 25 with domain_blueprint.
10. compliance_status = "draft_for_human_review" always.
11. No placeholder text, no TBD, no filler. All content specific and job-ready.

REQUIRED lessons array structure (follow this exactly):
  order 1-4:   module 1, step_type "lesson" x4
  order 5-8:   module 2, step_type "lesson" x4
  order 9:     module 2, step_type "checkpoint"
  order 10-13: module 3, step_type "lesson" x4
  order 14:    module 3, step_type "checkpoint"
  order 15-18: module 4, step_type "lesson" x4
  order 19:    module 4, step_type "checkpoint"
  order 20-23: module 5, step_type "lesson" x4
  order 24:    module 5, step_type "exam"${complianceFragment}`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  let prompt: string;
  let _testTemperature: number | undefined;
  try {
    const body = await request.json();
    prompt = body?.prompt;
    // Internal test override — only accepted with X-Internal-Service-Key
    const isInternal = request.headers.get('x-internal-service-key') === process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (isInternal && typeof body?._testTemperature === 'number') {
      _testTemperature = body._testTemperature;
    }
  } catch {
    return safeError('Request body must be JSON with a "prompt" field', 400);
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return safeError('prompt is required and must be a non-empty string', 400);
  }
  if (prompt.length > 4000) {
    return safeError('prompt must be 4000 characters or fewer', 400);
  }

  // Gate 1: OpenAI client
  let openai;
  try {
    openai = getOpenAIClient();
  } catch {
    return safeError('OpenAI is not configured on this server', 503);
  }

  // Gate 1: GPT-4o call — attempt 1
  const systemPrompt = buildSystemPrompt(prompt);
  const temp1 = _testTemperature ?? 0.3;
  let raw1 = '';
  try {
    const c1 = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      temperature: temp1,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    });
    raw1 = c1.choices[0]?.message?.content ?? '';
  } catch (err) {
    return safeInternalError(err, 'OpenAI request failed');
  }

  // Gate 2: Parse → normalize → validate attempt 1
  let parsed: unknown = null;
  let normLog = { step_type_coercions: [] as string[], slug_sanitizations: [] as string[], slug_deduplicates: [] as string[], order_index_resequenced: false, compliance_status_enforced: false };
  let validation = { valid: false, errors: [] as string[], warnings: [] as string[] };

  try { parsed = JSON.parse(raw1); } catch { /* fall through to retry */ }
  if (parsed) {
    const norm = normalizeCourseOutline(parsed);
    parsed = norm.normalized;
    normLog = norm.log;
    validation = validateCourseOutline(parsed);
  }

  // Gate 1 retry: attempt 2 at temp+0.2 if attempt 1 failed
  // Skip retry if a test temperature was explicitly set (we want to observe raw failure)
  if ((!parsed || !validation.valid) && _testTemperature === undefined) {
    let raw2 = '';
    try {
      const c2 = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      });
      raw2 = c2.choices[0]?.message?.content ?? '';
    } catch (err) {
      return safeInternalError(err, 'OpenAI request failed on retry');
    }

    let parsed2: unknown = null;
    try { parsed2 = JSON.parse(raw2); } catch { /* both failed */ }

    if (parsed2) {
      const norm2 = normalizeCourseOutline(parsed2);
      const v2 = validateCourseOutline(norm2.normalized);
      if (v2.valid) {
        parsed = norm2.normalized;
        normLog = norm2.log;
        validation = v2;
      } else {
        return NextResponse.json(
          { error: 'Generated outline failed schema validation after retry', gate: 'schema_validation', errors: v2.errors, warnings: v2.warnings },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Model returned malformed JSON after retry', gate: 'json_parse' },
        { status: 422 }
      );
    }
  }

  // Gate 3: Force compliance_status = draft — AI cannot self-certify
  const outline = parsed as Record<string, unknown>;
  const course = outline.course as Record<string, unknown>;
  course.compliance_status = 'draft_for_human_review';
  course.compliance_notice =
    'AI-generated. Not verified against authoritative state requirements. Do not use for regulatory submissions without qualified human review.';

  return NextResponse.json({
    outline,
    meta: {
      gate_json_parse: 'passed',
      gate_schema_validation: 'passed',
      gate_compliance_status: 'draft_for_human_review',
      warnings: validation.warnings,
      model: 'gpt-4o',
      normalization: {
        step_type_coercions: normLog.step_type_coercions,
        slug_sanitizations: normLog.slug_sanitizations,
        slug_deduplicates: normLog.slug_deduplicates,
        order_index_resequenced: normLog.order_index_resequenced,
        compliance_status_enforced: normLog.compliance_status_enforced,
      },
    },
  });
}

export const POST = withApiAudit('/api/ai/generate-course-outline', _POST);
