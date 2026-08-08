import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  id: z.string().uuid().optional(), courseId: z.string().uuid(), title: z.string().min(1), slug: z.string().min(1),
  orderIndex: z.number().int().min(0), domainKey: z.string().min(1), targetHours: z.number().positive(),
  quizRequired: z.boolean(), quizQuestionCount: z.number().int().nullable().optional(), practicalRequired: z.boolean(),
  minimumPassingRate: z.number().nullable().optional(), supervisedHoursRequired: z.number().nullable().optional(), fieldworkHoursRequired: z.number().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = bodySchema.parse(await req.json());
    const db = await requireAdminClient();
    const payload = {
      course_id: body.courseId, title: body.title, slug: body.slug, order_index: body.orderIndex,
      target_hours: body.targetHours, domain_key: body.domainKey,
      metadata: { quizRequired: body.quizRequired, quizQuestionCount: body.quizQuestionCount ?? null, practicalRequired: body.practicalRequired,
        minimumPassingRate: body.minimumPassingRate ?? null, supervisedHoursRequired: body.supervisedHoursRequired ?? null, fieldworkHoursRequired: body.fieldworkHoursRequired ?? null },
    };
    const query = body.id ? db.from('course_modules').update(payload).eq('id', body.id) : db.from('course_modules').insert(payload);
    const { data, error } = await query.select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, module: data });
  } catch (error) {
    logger.error('[course-builder/module]', error);
    return NextResponse.json({ ok: false, error: 'Failed to save module' }, { status: 400 });
  }
}
