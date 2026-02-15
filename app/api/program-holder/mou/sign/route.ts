import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: NextRequest) {
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

  // Get user's program holder ID
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('program_holder_id')
    .eq('user_id', user.id)
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

  // Use service client for Storage (server-side)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const path = `program_holders/${phId}/holder_signature.png`;
  const { error: uploadError } = await serviceClient.storage
    .from('agreements')
    .upload(path, buffer, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    logger.error('Upload error:', uploadError);
    return new Response(uploadError.message, { status: 500 });
  }

  const sigUrl = path; // store path; you can build public URL when needed

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from('program_holders')
    .update({
      mou_status: 'signed_by_holder',
      mou_holder_name: name,
      mou_holder_signed_at: now,
      mou_holder_sig_url: sigUrl,
    })
    .eq('id', phId)
    .select(
      'id, name, payout_share, mou_status, mou_holder_name, mou_holder_signed_at'
    )
    .single();

  if (error) {
    logger.error('Update error:', error);
    return new Response(toErrorMessage(error), { status: 500 });
  }

  return Response.json(updated);
}
