import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { UltimateLmsPublisher } from '@/lib/ultimate-course-builder/release/lms-publisher';
import { validateLmsCoursePackage } from '@/lib/ultimate-course-builder/release/lms-package';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  if (!body.courseId || !body.package) {
    return NextResponse.json({ error: 'courseId and package are required' }, { status: 400 });
  }

  const validation = validateLmsCoursePackage(body.package);
  if (!validation.pass) {
    return NextResponse.json(
      { error: 'Course package incomplete', missing: validation.missing },
      { status: 400 },
    );
  }

  try {
    const db = await requireAdminClient();
    const result = await new UltimateLmsPublisher(db as any).publish(body.courseId, body.package);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Ultimate LMS publication failed:', error);
    return NextResponse.json({ error: 'Course publication failed' }, { status: 500 });
  }
}
