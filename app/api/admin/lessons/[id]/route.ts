import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { normalizeLessonType } from '@/lib/curriculum/lesson-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = createAdminClient();

  const { data, error } = await db
    .from('course_lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data });
}

async function _PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { courseId } = body;

  // courseId is required — scopes the write to a specific course
  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const db = createAdminClient();

  // Verify lesson belongs to the given course
  const { data: existing } = await db
    .from('course_lessons')
    .select('id')
    .eq('id', id)
    .eq('course_id', courseId as string)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

  const {
    title, lessonType, status, durationMinutes,
    passingScore, quizQuestions, videoFile, videoTranscript,
    videoRuntimeSeconds, requiresEvidence, requiresSignoff,
    requiresEvaluator, contentStructured, objectives,
    competencyCodes, practicalInstructions, practical, rubric,
  } = body as Record<string, any>;

  // Normalize legacy lesson type values to canonical enum
  const canonicalType = lessonType !== undefined
    ? normalizeLessonType(lessonType as string)
    : undefined;

  // 1. Update course_lessons
  const lessonPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined)               lessonPatch.title = title;
  if (canonicalType !== undefined)       lessonPatch.lesson_type = canonicalType;
  if (status !== undefined)              lessonPatch.status = status;
  if (durationMinutes !== undefined)     lessonPatch.duration_minutes = durationMinutes;
  if (passingScore !== undefined)        lessonPatch.passing_score = passingScore;
  if (quizQuestions !== undefined)       lessonPatch.quiz_questions = quizQuestions;
  if (videoFile !== undefined)           lessonPatch.video_file = videoFile || null;
  if (videoTranscript !== undefined)     lessonPatch.video_transcript = videoTranscript || null;
  if (videoRuntimeSeconds !== undefined) lessonPatch.video_runtime_seconds = videoRuntimeSeconds ?? 0;
  if (requiresEvidence !== undefined)    lessonPatch.requires_evidence = requiresEvidence;
  if (requiresSignoff !== undefined)     lessonPatch.requires_signoff = requiresSignoff;
  if (requiresEvaluator !== undefined)   lessonPatch.requires_evaluator = requiresEvaluator;
  if (contentStructured !== undefined)   lessonPatch.content_structured = contentStructured;

  const { error: updateErr } = await db.from('course_lessons').update(lessonPatch).eq('id', id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // 2. Replace lesson_objectives
  if (Array.isArray(objectives)) {
    await db.from('lesson_objectives').delete().eq('lesson_id', id);
    const rows = (objectives as string[])
      .filter((o) => o?.trim())
      .map((o, i) => ({ lesson_id: id, objective_text: o.trim(), order_index: i }));
    if (rows.length > 0) {
      const { error: e } = await db.from('lesson_objectives').insert(rows);
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // 3. Replace lesson_competency_map
  if (Array.isArray(competencyCodes)) {
    await db.from('lesson_competency_map').delete().eq('lesson_id', id);
    const rows = (competencyCodes as string[])
      .filter((c) => c?.trim())
      .map((c) => ({ lesson_id: id, competency_code: c.trim() }));
    if (rows.length > 0) {
      const { error: e } = await db.from('lesson_competency_map').insert(rows);
      if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // 4. Upsert practical_requirements
  if (practical !== undefined || practicalInstructions !== undefined || rubric !== undefined) {
    const prPatch: Record<string, unknown> = {
      lesson_id: id,
      practical_type: canonicalType ?? 'lab',
    };
    if (practicalInstructions !== undefined)                prPatch.instructions = practicalInstructions;
    if (practical?.requiredHours !== undefined)             prPatch.required_hours = practical.requiredHours;
    if (practical?.requiredAttempts !== undefined)          prPatch.required_attempts = practical.requiredAttempts;
    if (practical?.requiresEvaluatorApproval !== undefined) prPatch.requires_evaluator_approval = practical.requiresEvaluatorApproval;
    if (practical?.requiresSkillSignoff !== undefined)      prPatch.requires_skill_signoff = practical.requiresSkillSignoff;
    if (practical?.safetyGuidance !== undefined)            prPatch.safety_guidance = practical.safetyGuidance;
    if (practical?.materialsNeeded !== undefined)           prPatch.materials_needed = practical.materialsNeeded;
    if (rubric !== undefined)                               prPatch.rubric_json = rubric;
    const { error: prErr } = await db
      .from('practical_requirements')
      .upsert(prPatch, { onConflict: 'lesson_id' });
    if (prErr) return NextResponse.json({ error: prErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lessonId: id });
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = createAdminClient();

  const { error } = await db.from('course_lessons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export const GET    = withApiAudit('/api/admin/lessons/[id]', _GET);
export const PATCH  = withApiAudit('/api/admin/lessons/[id]', _PATCH);
export const DELETE = withApiAudit('/api/admin/lessons/[id]', _DELETE);
