export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { itemId } = await params;
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

    // Get the action item with its recap's organization
    const { data: item, error: itemErr } = await adminClient
      .from('meeting_action_items')
      .select(
        `
        id,
        recap_id,
        completed_at,
        meeting_recaps!inner(organization_id)
      `
      )
      .eq('id', itemId)
      .single();

    if (itemErr) {
      return NextResponse.json({ error: itemErr.message }, { status: 404 });
    }

    // Check organization access
    if (
      (item.meeting_recaps as any).organization_id !== profile.organization_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nextCompletedAt = item.completed_at ? null : new Date().toISOString();

    const { error: updErr } = await adminClient
      .from('meeting_action_items')
      .update({ completed_at: nextCompletedAt, completed_by: user.id })
      .eq('id', item.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, completed_at: nextCompletedAt },
      { status: 200 }
    );
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
