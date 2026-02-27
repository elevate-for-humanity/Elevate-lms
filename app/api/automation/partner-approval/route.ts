import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPartnerApproval, processPartnerDocument } from '@/lib/automation/partner-approval';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/automation/partner-approval
 * Check partner approval status or process a partner document
 */
async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { partner_id, document_id, program_id, state } = body;

    if (!partner_id) {
      return NextResponse.json({ error: 'partner_id required' }, { status: 400 });
    }

    let result;

    if (document_id) {
      // Process specific document and check approval
      result = await processPartnerDocument(
        partner_id,
        document_id,
        program_id || 'barber_apprenticeship',
        state || 'IN'
      );
    } else {
      // Just check approval status
      result = await checkPartnerApproval(
        partner_id,
        program_id || 'barber_apprenticeship',
        state || 'IN'
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Partner approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/automation/partner-approval', _POST);
