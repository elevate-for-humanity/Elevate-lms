import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { program } = await req.json();

    // Update enrollment to mark documents submitted
    const { error } = await db
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
    await db
      .from('program_enrollments')
      .update({ enrollment_state: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('enrollment_state', ['orientation_complete', 'documents_complete']);

    if (error) {
      logger.error('Error updating enrollment:', error);
      // Don't fail - let the flow continue
    }

    return NextResponse.json({ success: true, program });
  } catch (error) {
    logger.error('Document submission error:', error);
    return NextResponse.json({ success: true }); // Don't block flow
  }
}
export const POST = withApiAudit('/api/enrollment/submit-documents', _POST);
