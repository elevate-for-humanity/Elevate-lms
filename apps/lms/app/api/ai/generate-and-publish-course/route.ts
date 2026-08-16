/**
 * POST /api/ai/generate-and-publish-course
 *
 * Compatibility endpoint for callers that expect one-call generation + publish.
 * Generation and package persistence are owned exclusively by Course Factory;
 * this route retains auth, retry behavior, audit logging, and publication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { courseFactory } from '@/lib/course-factory';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface GenerateAndPublishRequest {
  title: string;
  audience: string;
  hours?: number;
  state?: string;
  credentialOrExam?: string;
  deliveryFormat?: string;
  prompt?: string;
  programId?: string;
}

function buildTopic(body: GenerateAndPublishRequest): string {
  return [
    `Complete workforce-ready training course titled "${body.title}".`,
    body.prompt ?? '',
    'Include practical, job-ready instruction, module checkpoints, and a final examination appropriate to the course.',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: GenerateAndPublishRequest;
  try {
    body = await request.json();
  } catch {
    return safeError('Request body must be valid JSON', 400);
  }

  if (!body?.title?.trim()) return safeError('title is required', 400);
  if (!body?.audience?.trim()) return safeError('audience is required', 400);

  const errorsPerAttempt: string[][] = [];
  let generationAttempt = 0;
  let result: Awaited<ReturnType<typeof courseFactory>> | null = null;

  // Preserve the historical three-attempt resilience while using one generator.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    generationAttempt = attempt;
    result = await courseFactory({
      programId: body.programId,
      title: body.title,
      topic: buildTopic(body),
      audience: body.audience,
      hours: body.hours,
      state: body.state,
      credential: body.credentialOrExam,
      deliveryFormat: body.deliveryFormat,
      additionalRequirements: body.prompt,
      moduleCount: 5,
      lessonsPerModule: 4,
      mode: 'replace',
      contentSource: 'ai',
      videoMode: 'off',
    });

    if (result.ok && result.courseId) break;
    errorsPerAttempt.push(result.errors ?? ['Course Factory generation failed']);
  }

  if (!result?.ok || !result.courseId) {
    return NextResponse.json(
      {
        ok: false,
        error: `Generation failed after ${generationAttempt} attempts`,
        errors_per_attempt: errorsPerAttempt,
      },
      { status: 422 },
    );
  }

  const db = await requireAdminClient();
  const { data: publishResult, error: publishErr } = await db.rpc('publish_course_from_staging', {
    p_course_id: result.courseId,
    p_program_id:
      body.programId && body.programId !== result.courseId ? body.programId : null,
  });

  if (publishErr) {
    return safeInternalError(publishErr, 'Failed to publish generated course');
  }

  const pub = (publishResult ?? {}) as {
    lessons_published?: number;
    curriculum_lessons_inserted?: number;
    curriculum_lessons_skipped?: number;
  };

  await logAdminAudit({
    action: AdminAction.BULK_CONTENT_GENERATED,
    actorId: auth.id ?? '00000000-0000-0000-0000-000000000000',
    entityType: 'courses',
    entityId: result.courseId,
    metadata: {
      title: result.title ?? body.title,
      modules_inserted: result.moduleCount ?? 0,
      lessons_published: pub.lessons_published ?? result.lessonCount ?? 0,
      curriculum_lessons_inserted: pub.curriculum_lessons_inserted ?? 0,
      generation_attempt: generationAttempt,
      normalization_applied: ['canonical-course-factory'],
      program_id: body.programId ?? null,
    },
    req: request,
  });

  return NextResponse.json({
    ok: true,
    course_id: result.courseId,
    title: result.title ?? body.title,
    modules_inserted: result.moduleCount ?? 0,
    lessons_published: pub.lessons_published ?? result.lessonCount ?? 0,
    curriculum_lessons_inserted: pub.curriculum_lessons_inserted ?? 0,
    curriculum_lessons_skipped: pub.curriculum_lessons_skipped ?? 0,
    compliance_status: 'draft_for_human_review',
    generation_attempt: generationAttempt,
    normalization_applied: ['canonical-course-factory'],
  });
}
