import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import {
  APPRENTICE_POLICY_KEYS,
  APPRENTICE_POLICY_VERSION,
  type ApprenticePolicyKey,
} from '@/lib/apprenticeship/apprentice-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedKeys = new Set<ApprenticePolicyKey>(Object.values(APPRENTICE_POLICY_KEYS));

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const agreementKey = body?.agreementKey as ApprenticePolicyKey | undefined;
  const acceptedName = String(body?.acceptedName || '').trim();
  if (!agreementKey || !allowedKeys.has(agreementKey) || acceptedName.length < 2) {
    return NextResponse.json({ error: 'Policy and full legal name are required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data: existing } = await db
    .from('agreement_acceptances')
    .select('id,accepted_at')
    .eq('subject_type', 'apprentice')
    .eq('subject_id', user.id)
    .eq('agreement_key', agreementKey)
    .eq('agreement_version', APPRENTICE_POLICY_VERSION)
    .maybeSingle();
  if (existing) return NextResponse.json({ success: true, acceptedAt: existing.accepted_at });

  const { data, error } = await db
    .from('agreement_acceptances')
    .insert({
      subject_type: 'apprentice',
      subject_id: user.id,
      agreement_key: agreementKey,
      agreement_version: APPRENTICE_POLICY_VERSION,
      accepted_name: acceptedName,
      accepted_email: user.email,
      accepted_ip:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    })
    .select('accepted_at')
    .single();
  if (error) {
    return NextResponse.json({ error: 'Unable to record acknowledgment' }, { status: 500 });
  }
  return NextResponse.json({ success: true, acceptedAt: data.accepted_at });
}

export const POST = withApiAudit('/api/apprentice/policy-acknowledgment', _POST);
