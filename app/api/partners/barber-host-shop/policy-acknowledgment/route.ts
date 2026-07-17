import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const POLICY_ID_MAP: Record<string, string> = {
  handbook: 'anti_discrimination',
  eeo: 'anti_discrimination',
  safety: 'safety',
  confidentiality: 'confidentiality',
  'compensation-compliance': 'compensation',
  reporting: 'termination',
};

const VALID_ACK = new Set([
  'anti_discrimination',
  'safety',
  'hours_tracking',
  'compensation',
  'confidentiality',
  'termination',
  'policy',
  'handbook',
]);

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const body = await req.json();
  const rawPolicies: string[] = Array.isArray(body.policies_acknowledged)
    ? body.policies_acknowledged
    : [];

  if (rawPolicies.length === 0) {
    return safeError('policies_acknowledged is required', 400);
  }

  const mapped = rawPolicies.map((id) => POLICY_ID_MAP[id] ?? id);
  const invalid = mapped.filter((a) => !VALID_ACK.has(a));
  if (invalid.length > 0) {
    return safeError(`Unknown policy types: ${invalid.join(', ')}`, 400);
  }

  const db = await requireAdminClient();
  const rows = [...new Set(mapped)].map((doc_type) => ({
    user_id: user.id,
    document_type: `barber_${doc_type}`,
  }));

  const { error } = await db
    .from('program_holder_acknowledgements')
    .upsert(rows, { onConflict: 'user_id,document_type' });

  if (error) {
    logger.error('Barber policy acknowledgment insert error:', error);
    return safeInternalError(error, 'Failed to record acknowledgments');
  }

  logger.info(`Barber policy acknowledgments for ${user.id}: ${mapped.join(', ')}`);
  return NextResponse.json({ success: true, recorded: rows.length });
}
