import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { loadAllBlueprints, courseFactory } from '@/lib/course-factory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BodySchema = z.object({
  blueprintId: z.string().min(1),
  programId: z.string().uuid(),
  mode: z.enum(['replace','missing-only']).default('missing-only'),
  contentSource: z.enum(['ai','blueprint','curriculum_lessons']).default('ai'),
  videoMode: z.enum(['queue','off']).default('queue'),
  videoQueueLimit: z.number().int().positive().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid input', 400);
  try {
    const blueprints = await loadAllBlueprints();
    const blueprint = blueprints.find((item) => item.id === parsed.data.blueprintId);
    if (!blueprint) return safeError('Blueprint not found', 404);

    const progress: Array<{ stage: string; message: string; progress?: number }> = [];
    const result = await courseFactory({
      programId: parsed.data.programId,
      blueprint,
      mode: parsed.data.mode,
      contentSource: parsed.data.contentSource,
      videoMode: parsed.data.videoMode,
      videoQueueLimit: parsed.data.videoQueueLimit,
    }, (stage, message, percent) => progress.push({ stage, message, progress: percent }));

    return NextResponse.json({ ...result, progress }, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return safeInternalError(error, 'Course generation failed');
  }
}
