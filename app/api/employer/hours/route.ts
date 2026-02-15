
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
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

    // Get unapproved hours
    // If employer, only show their students
    // If admin/sponsor, show all
    const query = supabase
      .from('apprenticeship_hours')
      .select(
        `
        id,
        date_worked,
        hours,
        category,
        approved,
        notes,
        created_at,
        user_profiles!apprenticeship_hours_student_id_fkey(
          first_name,
          last_name,
          email,
          employer_id
        )
      `
      )
      .eq('approved', false)
      .order('date_worked', { ascending: false });

    // Filter by employer if not admin
    if (profile.role === 'employer' && profile.employer_id) {
      // This requires a join - we'll filter in JS for now
      const { data: allHours } = await query;
      const hours = allHours?.filter(
        (item: any) => item.user_profiles?.employer_id === profile.employer_id
      );
      return NextResponse.json({ hours: hours || [] });
    }

    const { data: hours } = await query;
    return NextResponse.json({ hours: hours || [] });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to load hours' },
      { status: 500 }
    );
  }
}
