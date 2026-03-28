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

    const { program } = await req.json();

    // Update enrollment to mark documents submitted
    const { error } = await supabase
      .from('program_enrollments')
      .update({ 
        documents_submitted_at: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .is('documents_submitted_at', null);

    // Advance state machine: orientation_complete → active
    // (documents_complete is not a distinct state in this flow)
    await supabase
      .from('program_enrollments')
      .update({ enrollment_state: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('enrollment_state', ['orientation_complete', 'documents_complete']);

    if (error) {
      logger.error('Error updating enrollment:', { code: error.code, message: error.message, userId: user.id, route: '/api/enrollment/submit-documents' });
      return failure('Failed to record document submission. Please try again or call (317) 314-3757.');
    }

    return success({ program });
  } catch (err: unknown) {
    logger.error('Document submission error:', err);
    return failure('Failed to process document submission.');
  }
}
export const POST = withApiAudit('/api/enrollment/submit-documents', _POST);
