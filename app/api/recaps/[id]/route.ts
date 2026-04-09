import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await getAdminClient();

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

    const { data: recap, error: recapErr } = await adminClient
      .from('meeting_recaps')
      .select(
        'id,organization_id,title,meeting_date,attendee_email,summary,key_points,decisions,follow_up_email,created_at'
      )
      .eq('id', id)
      .single();

    if (recapErr) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 404 });
    }

    if (recap.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: items } = await adminClient
      .from('meeting_action_items')
      .select('id,label,due_date,completed_at')
      .eq('recap_id', recap.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ recap, items: items || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/recaps/[id]', _GET);
