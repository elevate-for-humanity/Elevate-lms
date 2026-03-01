
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { enrollment_id, date, hours, services_performed, notes } = body;

    // Insert into consolidated hour_entries table
    const { data, error }: any = await db
      .from('hour_entries')
      .insert({
        user_id: user.id,
        source_type: 'ojl',
        work_date: date,
        hours_claimed: hours,
        entered_by_email: user.email,
        notes: [services_performed, notes].filter(Boolean).join(' — ') || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/student/log-hours', _POST, { critical: true });
