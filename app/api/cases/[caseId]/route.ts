import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCaseTimeline, getCaseTasks, transitionCaseStatus, checkSignatureCompleteness } from '@/lib/workflow/case-management';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;

    const { data: enrollmentCase, error } = await db
      .from('enrollment_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error || !enrollmentCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (enrollmentCase.student_id !== user.id && 
        enrollmentCase.program_holder_id !== user.id && 
        enrollmentCase.employer_id !== user.id) {
      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['admin', 'staff'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const [timeline, tasks, completeness] = await Promise.all([
      getCaseTimeline(caseId),
      getCaseTasks(caseId),
      checkSignatureCompleteness(caseId),
    ]);

    return NextResponse.json({
      case: enrollmentCase,
      timeline,
      tasks,
      signatureCompleteness: completeness,
    });
  } catch (err: any) {
    logger.error('[GET /api/cases/[caseId]] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const success = await transitionCaseStatus(caseId, status, user.id, profile?.role || 'student');

    if (!success) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('[PATCH /api/cases/[caseId]] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
