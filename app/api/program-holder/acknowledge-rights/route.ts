import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, title } = body;

    if (!fullName || !title) {
      return NextResponse.json(
        { error: 'Full name and title are required' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = await db
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Insert acknowledgement
    const { data, error }: any = await db
      .from('program_holder_acknowledgements')
      .insert({
        user_id: user.id,
        document_type: 'rights',
        full_name: fullName,
        title,
        organization_name: profile?.full_name || fullName,
        contact_name: fullName,
        email: profile?.email || user.email,
        agreed: true,
        acknowledged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('[Acknowledge Rights] Error:', error);
      return NextResponse.json(
        { error: 'Failed to record acknowledgement' },
        { status: 500 }
      );
    }

    logger.info('[Acknowledge Rights] Success:', {
      userId: user.id,
      fullName,
      title,
    });

    return NextResponse.json({
      success: true,
      message: 'Rights & Responsibilities acknowledgement recorded',
      data,
    });
  } catch (err: any) {
    logger.error(
      '[Acknowledge Rights] Error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/program-holder/acknowledge-rights', _POST);
