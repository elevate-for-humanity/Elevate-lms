import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getServiceDb } from '@/lib/course-builder/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  orderIndex: z.number().int().min(0),
  domainKey: z.string().min(1),
  targetHours: z.number().positive(),
  quizRequired: z.boolean(),
  quizQuestionCount: z.number().int().nullable().optional(),
  practicalRequired: z.boolean(),
  minimumPassingRate: z.number().nullable().optional(),
  supervisedHoursRequired: z.number().nullable().optional(),
  fieldworkHoursRequired: z.number().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = bodySchema.parse(await req.json());
    const db = getServiceDb();

    const payload = {
      course_id: body.courseId,
      title: body.title,
      slug: body.slug,
      order_index: body.orderIndex,
      metadata: {
        domainKey: body.domainKey,
        targetHours: body.targetHours,
        quizRequired: body.quizRequired,
        quizQuestionCount: body.quizQuestionCount ?? null,
        practicalRequired: body.practicalRequired,
        minimumPassingRate: body.minimumPassingRate ?? null,
        supervisedHoursRequired: body.supervisedHoursRequired ?? null,
        fieldworkHoursRequired: body.fieldworkHoursRequired ?? null,
      },
    };

    if (body.id) {
      const { data, error } = await db.from('course_modules').update(payload).eq('id', body.id).select('*').single();
      if (error) throw error;
      return NextResponse.json({ ok: true, module: data });
    }

    const { data, error } = await db.from('course_modules').insert(payload).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, module: data });
  } catch (error) {
    console.error('[course-builder/module]', error);
    return NextResponse.json({ ok: false, error: 'Failed to save module' }, { status: 400 });
  }
}
