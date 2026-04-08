import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { name, signatureDataUrl } = body || {};

  if (!name || !signatureDataUrl) {
    return new Response('Missing name or signature', { status: 400 });
  }

  // Use admin client for all DB + storage writes (bypasses RLS)
  const adminClient = createAdminClient();
  if (!adminClient) {
    return new Response('Server error', { status: 500 });
  }

  // Get program_holder_id from profiles (canonical source)
  const { data: prof } = await adminClient
    .from('profiles')
    .select('program_holder_id')
    .eq('id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return new Response('No program holder assigned', { status: 400 });
  }

  const phId = prof.program_holder_id;

  // Decode data URL
  const matches = signatureDataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!matches) {
    return new Response('Invalid signature format', { status: 400 });
  }

  const base64 = matches[1];
  const buffer = Buffer.from(base64, 'base64');

  const path = `program_holders/${phId}/holder_signature.png`;
  const { error: uploadError } = await adminClient.storage
    .from('agreements')
    .upload(path, buffer, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    logger.error('MOU upload failed', undefined, { detail: uploadError.message });
    return new Response('Upload failed', { status: 500 });
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await adminClient
    .from('program_holders')
    .update({
      mou_signed: true,
      mou_signed_at: now,
      mou_status: 'signed_by_holder',
      mou_holder_name: name,
      mou_holder_signed_at: now,
      mou_holder_sig_url: path,
    })
    .eq('id', phId)
    .select(
      'id, name, payout_share, mou_status, mou_signed, mou_holder_name, mou_holder_signed_at'
    )
    .single();

  if (error) {
    logger.error('Update error:', error);
    return new Response(toErrorMessage(error), { status: 500 });
  }

  return Response.json(updated);
}
export const POST = withApiAudit('/api/program-holder/mou/sign', _POST);
