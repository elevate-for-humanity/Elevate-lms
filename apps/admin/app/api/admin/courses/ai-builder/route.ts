/**
 * POST /api/admin/courses/ai-builder
 *
 * RETIRED legacy endpoint. Canonical AI course generation is
 * POST /api/admin/course-builder with action=generate.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const InputSchema = z.object({
  prompt: z.string().min(10).max(20000),
  courseTitle: z.string().max(200).optional(),
  audience: z.string().max(200).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  lessonCount: z.number().int().min(1).max(20).optional(),
  durationHours: z.number().min(0.5).max(200).optional(),
  tone: z.string().max(100).optional(),
  includeQuiz: z.boolean().optional(),
  includeReflection: z.boolean().optional(),
});

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      error: 'LEGACY_SYSTEM_DISABLED',
      message: 'Use POST /api/admin/course-builder with action=generate.',
      canonicalEndpoint: '/api/admin/course-builder',
      action: 'generate',
    },
    { status: 410 },
  );
}

export const POST = withApiAudit('/api/admin/courses/ai-builder', _POST, {
  actor_type: 'admin',
  skip_body: true,
});
