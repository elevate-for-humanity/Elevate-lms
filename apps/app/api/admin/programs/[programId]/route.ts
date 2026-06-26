import { NextResponse } from 'next/server';
import { ProgramUpdateSchema } from '@/lib/validators/course';
import { getProgram, updateProgram, deleteProgram } from '@/lib/db/courses';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request, { params }: { params: Promise<{ programId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { programId } = await params;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const data = await getProgram(programId);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _PATCH(request: Request, { params }: { params: Promise<{ programId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { programId } = await params;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const before = await getProgram(programId);
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json().catch(() => null);
    const parsed = ProgramUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const data = await updateProgram(programId, parsed.data);
    await auth.db.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.role,
      action: 'update',
      resource_type: 'program',
      resource_id: programId,
      before_state: before,
      after_state: data,
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ programId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { programId } = await params;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const before = await getProgram(programId);
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = await deleteProgram(programId);
    await auth.db.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.role,
      action: 'delete',
      resource_type: 'program',
      resource_id: programId,
      before_state: before,
      after_state: { ...before, status: 'archived' },
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/admin/programs/[programId]', _GET);
export const PATCH = withApiAudit('/api/admin/programs/[programId]', _PATCH);
export const DELETE = withApiAudit('/api/admin/programs/[programId]', _DELETE);
