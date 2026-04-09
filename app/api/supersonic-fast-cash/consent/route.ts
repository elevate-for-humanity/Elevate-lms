import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  // Require authenticated session
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return safeError('Authentication required', 401);
  }

  let body: {
    full_name?: string;
    ssn_last4?: string;
    signature_text?: string;
    consent_version?: string;
    document_snapshot?: string;
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { full_name, ssn_last4, signature_text, consent_version, document_snapshot } = body;

  // Validate all required fields
  if (!full_name || full_name.trim().length < 2) {
    return safeError('Full legal name is required', 400);
  }
  if (!ssn_last4 || !/^\d{4}$/.test(ssn_last4)) {
    return safeError('Last 4 digits of SSN are required', 400);
  }
  if (!signature_text || signature_text.trim().length < 2) {
    return safeError('Signature is required', 400);
  }
  if (!document_snapshot || document_snapshot.trim().length < 100) {
    return safeError('Document snapshot is required', 400);
  }

  // Capture IP and user agent
  const ip_address =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const user_agent = request.headers.get('user-agent') || 'unknown';

  // Write via service role (bypasses RLS — client cannot self-insert)
  const admin = await getAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');
  const { error: insertError } = await admin
    .from('client_consents')
    .insert({
      client_id: user.id,
      full_name: full_name.trim(),
      ssn_last4,
      ip_address,
      user_agent,
      consent_version: consent_version || 'v1.0',
      signature_text: signature_text.trim(),
      document_snapshot: document_snapshot.trim(),
      signed_at: new Date().toISOString(),
    });

  if (insertError) {
    return safeInternalError(insertError, 'Failed to save consent record');
  }

  return NextResponse.json({ ok: true });
}

// Check whether the current user has a valid consent on file
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return safeError('Authentication required', 401);
  }

  const admin = await getAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');
  const { data, error } = await admin
    .from('client_consents')
    .select('id, consent_version, signed_at')
    .eq('client_id', user.id)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return safeInternalError(error, 'Failed to check consent status');
  }

  return NextResponse.json({ consented: !!data, record: data ?? null });
}
