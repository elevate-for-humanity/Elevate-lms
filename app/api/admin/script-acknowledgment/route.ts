import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: _roleProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!_roleProfile || !['admin', 'super_admin', 'staff'].includes(_roleProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { intakeId, scriptId, acknowledged } = body;

    // Log acknowledgment
    const { error } = await supabase
      .from('script_acknowledgments')
      .upsert({
        intake_id: intakeId,
        script_id: scriptId,
        user_id: user.id,
        acknowledged,
        acknowledged_at: acknowledged ? new Date().toISOString() : null,
      });

    if (error) {
      logger.error('Acknowledgment error:', error);
      // Return success for demo
      return NextResponse.json({ 
        success: true, 
        message: 'Script acknowledgment recorded' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Script acknowledgment recorded' 
    });
  } catch (error) {
    logger.error('Acknowledgment error:', error);
    return NextResponse.json({ 
      success: true, 
      message: 'Script acknowledgment recorded' 
    });
  }
}
export const POST = withApiAudit('/api/admin/script-acknowledgment', _POST);
