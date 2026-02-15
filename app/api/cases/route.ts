import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEnrollmentCase } from '@/lib/workflow/case-management';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { programSlug, programType, programHolderId, employerId, regionId, fundingSource, signaturesRequired } = body;

    if (!programSlug) {
      return NextResponse.json({ error: 'programSlug is required' }, { status: 400 });
    }

    const enrollmentCase = await createEnrollmentCase({
      studentId: user.id,
      programSlug,
      programType,
      programHolderId,
      employerId,
      regionId,
      fundingSource,
      signaturesRequired,
    });

    if (!enrollmentCase) {
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
    }

    return NextResponse.json({ success: true, case: enrollmentCase });
  } catch (err: any) {
    logger.error('[POST /api/cases] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('enrollment_cases')
      .select('*')
      .or(`student_id.eq.${user.id},program_holder_id.eq.${user.id},employer_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ cases: data || [] });
  } catch (err: any) {
    logger.error('[GET /api/cases] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
