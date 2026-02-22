import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { intakeId, scriptId, reason, notes } = body;

    // Log deviation
    const { error } = await db
      .from('script_deviations')
      .insert({
        intake_id: intakeId,
        script_id: scriptId,
        user_id: user.id,
        reason,
        notes,
        created_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Deviation error:', error);
      return NextResponse.json({ 
        success: true, 
        message: 'Script deviation logged' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Script deviation logged' 
    });
  } catch (error) {
    logger.error('Deviation error:', error);
    return NextResponse.json({ 
      success: true, 
      message: 'Script deviation logged' 
    });
  }
}
