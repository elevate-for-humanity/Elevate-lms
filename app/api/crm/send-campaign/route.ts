import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...body,
        created_by: user.id,
        status: 'queued',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to queue campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign: data });
  } catch {
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/crm/send-campaign', _POST);
