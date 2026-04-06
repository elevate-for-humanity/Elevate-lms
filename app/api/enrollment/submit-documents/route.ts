import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { success, failure } from '@/lib/api/safe-handler';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { program, enrollmentId } = await req.json();

    // Resolve the enrollment to update — prefer explicit enrollmentId,
    // fall back to most recent pending enrollment for this user
    let targetId: string | null = enrollmentId ?? null;

    if (!targetId) {
      const { data: pending } = await supabase
        .from('program_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .is('documents_submitted_at', null)
        .in('enrollment_state', ['orientation_complete', 'documents_complete', 'confirmed'])
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      targetId = pending?.id ?? null;
    }

    if (!targetId) {
      return failure('No pending enrollment found for document submission.');
    }

    // Single scoped update — both fields in one write, scoped to verified enrollment id
    const { error } = await supabase
      .from('program_enrollments')
      .update({
        documents_submitted_at: new Date().toISOString(),
        status: 'active',
        enrollment_state: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetId)
      .eq('user_id', user.id); // ownership re-check on write

    if (error) {
      logger.error('Error updating enrollment:', { code: error.code, message: error.message, userId: user.id, enrollmentId: targetId, route: '/api/enrollment/submit-documents' });
      return failure('Failed to record document submission. Please try again or call (317) 314-3757.');
    }

    return success({ program, enrollmentId: targetId });
  } catch (err: unknown) {
    logger.error('Document submission error:', err);
    return failure('Failed to process document submission.');
  }
}
export const POST = withApiAudit('/api/enrollment/submit-documents', _POST);
