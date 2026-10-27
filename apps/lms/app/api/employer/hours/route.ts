import { getEmployerRecord } from '@/lib/employer/employer-context';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['employer', 'admin', 'super_admin', 'sponsor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - requires employer/admin/sponsor role' },
        { status: 403 },
      );
    }

    const isAdmin = ['admin', 'super_admin'].includes(profile.role);
    const employer = isAdmin ? null : await getEmployerRecord(supabase, user.id);
    if (!isAdmin && !employer) return NextResponse.json({ error: 'Employer account is not connected' }, { status: 403 });
    const { data: apprentices, error: scopeError } = !isAdmin
      ? await supabase.from('apprentices').select('user_id').eq('employer_id', employer!.id).eq('status', 'active')
      : { data: [], error: null };
    if (scopeError) throw scopeError;
    const studentIds = (apprentices ?? []).map(row => row.user_id).filter(Boolean);
    if (!isAdmin && !studentIds.length) return NextResponse.json({ hours: [] });

    // Get pending hours from hour_entries
    const query = supabase
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
      `,
      )
      .eq('status', 'pending')
      .order('work_date', { ascending: false });

    const { data: pendingHours, error: hoursError } = await (isAdmin ? query : query.in('user_id', studentIds));
    if (hoursError) throw hoursError;

    // Enrich with user profile data
    const userIds = [...new Set((pendingHours || []).map((h: any) => h.user_id).filter(Boolean))];
    const profileMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      for (const p of profiles || []) {
        profileMap[p.id] = p;
      }
    }

    const hours = (pendingHours || []).map((h: any) => ({
      ...h,
      profile: profileMap[h.user_id] || null,
    }));

    return NextResponse.json({ hours });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to load hours' },
      { status: 500 },
    );
  }
}
export const GET = withApiAudit('/api/employer/hours', _GET);
