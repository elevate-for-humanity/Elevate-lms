export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Get user's organization
    const { data: profile } = await adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const patch = (await req.json()) as {
      status?: 'todo' | 'in_progress' | 'done';
      notes?: string | null;
      due_date?: string | null;
    };

    const { data: row, error: rowErr } = await adminClient
      .from('workone_checklist')
      .select('id,organization_id,user_id,status')
      .eq('id', id)
      .single();

    if (rowErr) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (row.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Allow user to update their own checklist
    const isSelf = row.user_id === user.id;
    if (!isSelf) {
      // Could add org_admin check here
    }

    const next: any = {};
    if (patch.status) next.status = patch.status;
    if ('notes' in patch) next.notes = patch.notes;
    if ('due_date' in patch) next.due_date = patch.due_date;

    if (patch.status === 'done') next.completed_at = new Date().toISOString();
    if (patch.status && patch.status !== 'done') next.completed_at = null;

    const { error: updErr } = await adminClient
      .from('workone_checklist')
      .update(next)
      .eq('id', row.id);

    if (updErr) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          ('Internal server error') ||
          'Internal server err',
      },
      { status: 500 }
    );
  }
}
