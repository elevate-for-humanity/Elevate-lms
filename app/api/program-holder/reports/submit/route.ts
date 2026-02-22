import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a program holder
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'program_holder') {
      return NextResponse.json(
        { error: 'Forbidden - Program holder access required' },
        { status: 403 }
      );
    }

    // Get program holder record
    const { data: programHolder, error: phError } = await db
      .from('program_holders')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (phError || !programHolder) {
      return NextResponse.json(
        { error: 'Program holder record not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const weekEnding = formData.get('week_ending') as string;
    const hoursWorked = parseFloat(formData.get('hours_worked') as string);
    const skillsPracticed = formData.get('skills_practiced') as string;
    const challenges = formData.get('challenges') as string;
    const notes = formData.get('notes') as string;

    // Validate required fields
    if (!weekEnding || isNaN(hoursWorked)) {
      return NextResponse.json(
        { error: 'Missing required fields: week_ending and hours_worked' },
        { status: 400 }
      );
    }

    // Insert report
    const { data: report, error: insertError } = await db
      .from('apprentice_weekly_reports')
      .insert({
        program_holder_id: programHolder.id,
        week_ending: weekEnding,
        hours_worked: hoursWorked,
        skills_practiced: skillsPracticed,
        challenges: challenges,
        notes: notes,
        status: 'pending',
        submitted_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    // Log the action
    await db.from('audit_logs').insert({
      user_id: user.id,
      action: 'report_submitted',
      resource_type: 'apprentice_weekly_report',
      resource_id: report.id,
      metadata: {
        week_ending: weekEnding,
        hours_worked: hoursWorked,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully',
        report_id: report.id,
      },
      { status: 201 }
    );
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
