import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    if (action === 'handbook_acknowledgment') {
      const { error } = await db.from('handbook_acknowledgments').insert({
        user_id: user.id,
        handbook_version: params.handbookVersion || '1.0',
        acknowledged_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
      if (error) {
        logger.error('[Compliance] Handbook acknowledgment failed:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to record acknowledgment' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'agreement_acceptance') {
      const { data, error } = await db.from('agreement_acceptances').insert({
        subject_type: 'apprentice',
        subject_id: user.id,
        agreement_key: params.agreementType || params.agreementKey,
        agreement_version: params.documentVersion || params.agreementVersion || '1.0',
        accepted_name: params.signerName || params.acceptedName,
        accepted_email: params.signerEmail || params.acceptedEmail || user.email,
        accepted_at: new Date().toISOString(),
        accepted_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0',
        user_agent: request.headers.get('user-agent') || 'unknown',
      }).select('id').single();
      if (error) {
        logger.error('[Compliance] Agreement acceptance failed:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to record agreement' }, { status: 500 });
      }
      return NextResponse.json({ success: true, acceptanceId: data?.id });
    }

    if (action === 'update_onboarding') {
      const { error } = await db.from('profiles').update({
        [params.field]: params.value,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) {
        logger.error('[Compliance] Onboarding update failed:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    logger.error('[Compliance] API error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET: fetch user's compliance data (acknowledgments, agreements)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');

    if (type === 'handbook') {
      const { data } = await db.from('handbook_acknowledgments')
        .select('handbook_version, acknowledged_at')
        .eq('user_id', user.id);
      return NextResponse.json({ data: data || [] });
    }

    if (type === 'agreements') {
      const { data } = await db.from('agreement_acceptances')
        .select('id, agreement_key, agreement_version, accepted_at')
        .eq('subject_id', user.id);
      // Map to expected field names for frontend compatibility
      const mapped = (data || []).map((a: any) => ({ ...a, agreement_type: a.agreement_key }));
      return NextResponse.json({ data: mapped });
    }

    // Return all
    const [handbook, agreements] = await Promise.all([
      db.from('handbook_acknowledgments').select('handbook_version, acknowledged_at').eq('user_id', user.id),
      db.from('agreement_acceptances').select('id, agreement_key, agreement_version, accepted_at').eq('subject_id', user.id),
    ]);
    const mappedAgreements = (agreements.data || []).map((a: any) => ({ ...a, agreement_type: a.agreement_key }));

    return NextResponse.json({
      handbook: handbook.data || [],
      agreements: mappedAgreements,
    });
  } catch (err) {
    logger.error('[Compliance] GET error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
