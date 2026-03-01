
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
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

    // Get user profile and check role
    const { data: profile } = await db
      .from('user_profiles')
      .select('role, employer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['employer', 'admin', 'sponsor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - requires employer/admin/sponsor role' },
        { status: 403 }
      );
    }

    // Get pending hours from hour_entries
    const query = db
      .from('hour_entries')
      .select(
        `
        id,
        work_date,
        hours_claimed,
        category,
        source_type,
        status,
        notes,
        created_at,
        user_id
      `
      )
      .eq('status', 'pending')
      .order('work_date', { ascending: false });

    const { data: pendingHours } = await query;

    // Enrich with user profile data
    const userIds = [...new Set((pendingHours || []).map((h: any) => h.user_id).filter(Boolean))];
    let profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('user_profiles')
        .select('user_id, first_name, last_name, email, employer_id')
        .in('user_id', userIds);
      for (const p of profiles || []) {
        profileMap[p.user_id] = p;
      }
    }

    let hours = (pendingHours || []).map((h: any) => ({
      ...h,
      user_profiles: profileMap[h.user_id] || null,
    }));

    // Filter by employer if not admin
    if (profile.role === 'employer' && profile.employer_id) {
      hours = hours.filter(
        (item: any) => item.user_profiles?.employer_id === profile.employer_id
      );
    }

    return NextResponse.json({ hours });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to load hours' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/employer/hours', _GET);
