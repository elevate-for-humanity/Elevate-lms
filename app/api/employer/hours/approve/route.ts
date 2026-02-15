
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
    const { hour_id } = await req.json();

    if (!hour_id) {
      return NextResponse.json(
        { error: 'Hour ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is employer/admin/sponsor
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

    // If employer, verify they supervise this student
    if (profile.role === 'employer' && profile.employer_id) {
      const { data: hourRecord } = await supabase
        .from('apprenticeship_hours')
        .select(
          `
          student_id,
          user_profiles!apprenticeship_hours_student_id_fkey(employer_id)
        `
        )
        .eq('id', hour_id)
        .single();

      const userProfiles = hourRecord?.user_profiles as any;
      if (userProfiles?.employer_id !== profile.employer_id) {
        return NextResponse.json(
          { error: "Forbidden - can only approve your own students' hours" },
          { status: 403 }
        );
      }
    }

    // Approve the hours
    const { error } = await supabase
      .from('apprenticeship_hours')
      .update({
        approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', hour_id);

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to approve hours' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to approve hours' },
      { status: 500 }
    );
  }
}
