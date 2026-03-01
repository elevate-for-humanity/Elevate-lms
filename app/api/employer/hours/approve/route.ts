
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { hour_id } = await req.json();

    if (!hour_id) {
      return NextResponse.json(
        { error: 'Hour ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is employer/admin/sponsor
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

    // Load the hour entry to validate source_type and ownership
    const { data: hourRecord } = await db
      .from('hour_entries')
      .select('user_id, source_type, status')
      .eq('id', hour_id)
      .single();

    if (!hourRecord) {
      return NextResponse.json({ error: 'Hour entry not found' }, { status: 404 });
    }

    // Employer cannot approve RTI hours
    const isRti = ['rti', 'in_state_barber_school', 'continuing_education'].includes(hourRecord.source_type);
    if (isRti && profile.role === 'employer') {
      return NextResponse.json(
        { error: 'Employers cannot approve RTI hours — requires sponsor or admin' },
        { status: 403 }
      );
    }

    // Employer must supervise this student
    if (profile.role === 'employer' && profile.employer_id && hourRecord.user_id) {
      const { data: studentProfile } = await db
        .from('user_profiles')
        .select('employer_id')
        .eq('user_id', hourRecord.user_id)
        .single();

      if (studentProfile?.employer_id !== profile.employer_id) {
        return NextResponse.json(
          { error: "Forbidden - can only approve your own students' hours" },
          { status: 403 }
        );
      }
    }

    // Approve the hours — trigger enforces attestation fields
    const { error } = await auditedMutation({
      table: 'hour_entries',
      operation: 'update',
      rowData: {
        status: 'approved',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        approved_by_role: profile.role,
        accepted_hours: null,
      },
      filter: { id: hour_id, status: 'pending' },
      audit: {
        action: 'api:post:/api/employer/hours/approve',
        actorId: user.id,
        targetType: 'hour_entries',
        targetId: hour_id,
        metadata: { employer_id: profile.employer_id, role: profile.role },
      },
    });

    if (error) {
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
export const POST = withApiAudit('/api/employer/hours/approve', _POST, { critical: true });
