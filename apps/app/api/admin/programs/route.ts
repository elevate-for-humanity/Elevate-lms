import { NextResponse } from 'next/server';
import { ProgramCreateSchema } from '@/lib/validators/course';
import { listPrograms } from '@/lib/db/courses';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const data = await listPrograms({ status });
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return safeInternalError(err, 'Failed to list programs');
  }
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    const parsed = ProgramCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Use service-role client — programs table has RLS that blocks user-session inserts
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('programs')
      .insert({
        code: parsed.data.code,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        duration_weeks: parsed.data.duration_weeks ?? null,
        total_hours: parsed.data.total_hours ?? null,
        tuition: parsed.data.tuition ?? null,
        funding_eligible: parsed.data.funding_eligible ?? true,
        status: parsed.data.status ?? 'draft',
        category: parsed.data.category ?? null,
        requirements: parsed.data.requirements ?? null,
        is_active: true,
        published: false,
      })
      .select()
      .maybeSingle();

    if (error) return safeInternalError(error, 'Failed to create program');
    if (!data) return safeError('Program created but no row returned', 500);

    // Audit log — non-fatal
    db.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.role,
      action: 'create',
      resource_type: 'program',
      resource_id: data.id,
      after_state: data,
    }).then(() => {}).catch(() => {});

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create program');
  }
}
export const GET = withApiAudit('/api/admin/programs', _GET);
export const POST = withApiAudit('/api/admin/programs', _POST);
