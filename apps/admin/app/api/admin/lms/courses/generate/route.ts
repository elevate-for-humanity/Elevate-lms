import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { courseFactory } from '@/lib/course-factory';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GenerateCourseSchema = z.object({
  programId: z.string().uuid().optional(),
  programSlug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(200).optional(),
  topic: z.string().min(1).max(500).optional(),
  audience: z.string().max(500).optional(),
  state: z.string().max(100).optional(),
  credential: z.string().max(200).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  hours: z.number().positive().max(2000).optional(),
  deliveryFormat: z.string().max(100).optional(),
  additionalRequirements: z.string().max(5000).optional(),
  moduleCount: z.number().int().min(1).max(50).optional(),
  lessonsPerModule: z.number().int().min(1).max(50).optional(),
  mode: z.enum(['replace', 'missing-only', 'refresh']).default('refresh'),
  contentSource: z.enum(['ai', 'blueprint', 'curriculum_lessons']).default('ai'),
  videoMode: z.enum(['queue', 'off']).default('queue'),
  videoQueueLimit: z.number().int().positive().max(500).nullable().optional(),
  dryRun: z.boolean().default(false),
}).refine(
  (value) => Boolean(value.programId || value.programSlug || value.topic || value.title),
  { message: 'One of programId, programSlug, topic, or title is required' },
);

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = GenerateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const progress: Array<{ stage: string; message: string; progress?: number }> = [];
    const result = await courseFactory(parsed.data, (stage, message, percent) => {
      progress.push({ stage, message, progress: percent });
    });

    return NextResponse.json(
      { ok: result.ok, result, progress },
      { status: result.ok ? 200 : 422 },
    );
  } catch (error) {
    logger.error('[admin/lms/courses/generate]', error);
    return NextResponse.json(
      { ok: false, error: 'Course generation failed' },
      { status: 500 },
    );
  }
}

export const POST = withApiAudit('/api/admin/lms/courses/generate', _POST, {
  actor_type: 'admin',
  skip_body: true,
});
