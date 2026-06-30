import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const VALID_ACKNOWLEDGMENTS = [
  'anti_discrimination',
  'safety',
  'hours_tracking',
  'compensation',
  'confidentiality',
  'termination',
  'policy',
  'handbook',
];

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const body = await req.json();
  const { acknowledgments } = body;

  if (!Array.isArray(acknowledgments) || acknowledgments.length === 0) {
    return safeError('acknowledgments array is required', 400);
  }

  const invalid = acknowledgments.filter((a: string) => !VALID_ACKNOWLEDGMENTS.includes(a));
  if (invalid.length > 0) {
    return safeError(`Unknown acknowledgment types: ${invalid.join(', ')}`, 400);
  }

  const db = await requireAdminClient();

  // Upsert one row per acknowledgment type
  const rows = acknowledgments.map((doc_type: string) => ({
    user_id: user.id,
    document_type: `cosmetology_${doc_type}`,
  }));

  const { error } = await db
    .from('program_holder_acknowledgements')
    .upsert(rows, { onConflict: 'user_id,document_type' });

  if (error) {
    logger.error('Cosmetology policy acknowledgment insert error:', error);
    return safeInternalError(error, 'Failed to record acknowledgments');
  }

  logger.info(`Cosmetology policy acknowledgments recorded for user ${user.id}: ${acknowledgments.join(', ')}`);
  return NextResponse.json({ success: true, recorded: acknowledgments.length });
}
