
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch employer incentives
    const { data: incentives, error } = await supabase
      .from('employer_incentives')
      .select(`
        *,
        employer:employers(name),
        student:profiles!student_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      // Error: $1
      throw error;
    }

    // Format the data
    const formattedIncentives = (incentives || []).map((inc: any) => ({
      id: inc.id,
      employer_name: inc.employer?.name || 'Unknown Employer',
      student_name: inc.student?.full_name || 'Unknown Student',
      program_type: inc.program_type,
      amount: inc.amount || 0,
      status: inc.status,
      start_date: inc.start_date,
      end_date: inc.end_date,
      hours_completed: inc.hours_completed || 0,
      hours_required: inc.hours_required || 0,
      created_at: inc.created_at,
    }));

    return NextResponse.json({
      incentives: formattedIncentives,
      count: formattedIncentives.length,
    });

  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to fetch incentives' },
      { status: 500 }
    );
  }
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      employer_id,
      student_id,
      program_type,
      amount,
      hours_required,
      start_date,
      end_date,
    } = body;

    // Validate required fields
    if (!employer_id || !student_id || !program_type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create incentive record
    const { data: incentive, error } = await supabase
      .from('employer_incentives')
      .insert({
        employer_id,
        student_id,
        program_type,
        amount,
        hours_required: hours_required || 0,
        hours_completed: 0,
        start_date,
        end_date,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Error: $1
      throw error;
    }

    await logAdminAudit({ action: AdminAction.INCENTIVE_CREATED, actorId: user.id, entityType: 'employer_incentives', entityId: incentive.id, metadata: { program_type, amount }, req });

    return NextResponse.json({
      success: true,
      incentive,
    });

  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to create incentive' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/admin/incentives', _GET);
export const POST = withApiAudit('/api/admin/incentives', _POST);
