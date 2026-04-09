import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/apprentice/handbook
 * Get student's handbook acknowledgment status
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check handbook acknowledgment (handbook_acknowledgments: user_id, handbook_version, acknowledged_at, ip_address, user_agent)
    const { data: acknowledgment } = await db
      .from('handbook_acknowledgments')
      .select('id, handbook_version, acknowledged_at')
      .eq('user_id', user.id)
      .order('acknowledged_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check apprentice agreement (agreement_acceptances: subject_type, subject_id, agreement_key, agreement_version, accepted_name)
    const { data: agreement } = await db
      .from('agreement_acceptances')
      .select('id, agreement_key, agreement_version, accepted_name, accepted_at')
      .eq('subject_id', user.id)
      .eq('agreement_key', 'apprentice_agreement')
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      handbookAcknowledged: !!acknowledgment,
      handbookVersion: acknowledgment?.handbook_version || null,
      acknowledgedAt: acknowledgment?.acknowledged_at || null,
      agreementSigned: !!agreement,
      signature: agreement?.accepted_name || null,
      signedAt: agreement?.accepted_at || null,
    });
  } catch (error) {
    logger.error('[Handbook API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/apprentice/handbook
 * Acknowledge handbook or sign apprentice agreement
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, signature, handbookVersion } = body;

    if (action === 'acknowledge') {
      const { error } = await db
        .from('handbook_acknowledgments')
        .insert({
          user_id: user.id,
          handbook_version: handbookVersion || '2025.1',
          acknowledged_at: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0',
          user_agent: request.headers.get('user-agent') || 'unknown',
        });

      if (error) {
        logger.error('[Handbook API] Acknowledge error:', error);
        return NextResponse.json({ error: 'Failed to acknowledge handbook' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'sign') {
      const { error } = await db
        .from('agreement_acceptances')
        .insert({
          subject_type: 'apprentice',
          subject_id: user.id,
          agreement_key: 'apprentice_agreement',
          agreement_version: '2025.1',
          accepted_name: signature,
          accepted_email: user.email || '',
          accepted_at: new Date().toISOString(),
          accepted_ip: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        });

      if (error) {
        logger.error('[Handbook API] Sign error:', error);
        return NextResponse.json({ error: 'Failed to sign agreement' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('[Handbook API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/apprentice/handbook', _GET);
export const POST = withApiAudit('/api/apprentice/handbook', _POST);
