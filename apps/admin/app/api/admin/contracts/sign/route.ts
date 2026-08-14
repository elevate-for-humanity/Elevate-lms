/**
 * POST /api/admin/contracts/sign
 *
 * Saves a signature to a contract prefill run.
 * Signature can only be placed after all required fields are approved or waived.
 * Does NOT auto-submit or auto-export. Admin must trigger export separately.
 *
 * Body: {
 *   contract_id: string;
 *   run_id: string;
 *   signer_name: string;
 *   signer_title: string;
 *   signer_email: string;
 *   signature_type: 'draw' | 'typed' | 'initials';
 *   signature_data?: string;  // base64 PNG for draw mode
 *   typed_name?: string;      // for typed mode
 *   page_number?: number;
 *   x?: number;
 *   y?: number;
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: {
    contract_id?: string;
    run_id?: string;
    signer_name?: string;
    signer_title?: string;
    signer_email?: string;
    signature_type?: 'draw' | 'typed' | 'initials';
    signature_data?: string;
    typed_name?: string;
    page_number?: number;
    x?: number;
    y?: number;
  };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const { contract_id, run_id, signer_name, signer_title, signer_email, signature_type } = body;
  if (!contract_id || !run_id || !signer_name || !signature_type) {
    return safeError('contract_id, run_id, signer_name, and signature_type are required', 400);
  }
  if (signature_type === 'draw' && !body.signature_data) {
    return safeError('signature_data is required for draw mode', 400);
  }
  if (signature_type === 'typed' && !body.typed_name) {
    return safeError('typed_name is required for typed mode', 400);
  }

  const db = await requireAdminClient();

  // Verify run exists and belongs to this contract
  const { data: run } = await db
    .from('contract_prefill_runs')
    .select('id, status, missing_values, approved_values')
    .eq('id', run_id)
    .eq('contract_template_id', contract_id)
    .maybeSingle();

  if (!run) return safeError('Prefill run not found', 404);

  // Check for unapproved required fields
  const missing = (run.missing_values as Record<string, string>) ?? {};
  const missingKeys = Object.keys(missing);
  if (missingKeys.length > 0) {
    return safeError(
      `Cannot sign: ${missingKeys.length} required field(s) still need admin input: ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? '...' : ''}`,
      422
    );
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;

  // Save signature field
  const { data: sigField, error: sigErr } = await db
    .from('contract_signature_fields')
    .insert({
      contract_template_id: contract_id,
      prefill_run_id: run_id,
      signer_name,
      signer_title: signer_title ?? null,
      signer_email: signer_email ?? null,
      signature_type,
      signature_data: body.signature_data ?? null,
      typed_name: body.typed_name ?? null,
      page_number: body.page_number ?? 1,
      x: body.x ?? null,
      y: body.y ?? null,
      signed_at: new Date().toISOString(),
      ip_address: ip,
    })
    .select('id, signed_at')
    .single();

  if (sigErr || !sigField) return safeInternalError(sigErr, 'Failed to save signature');

  // Update prefill run status
  await db.from('contract_prefill_runs')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', run_id);

  // Audit
  await db.from('contract_audit_logs').insert({
    actor_id: auth.id ?? null,
    action: 'sign',
    entity_type: 'contract_template',
    entity_id: contract_id,
    after_json: {
      run_id,
      signer_name,
      signer_title,
      signer_email,
      signature_type,
      signed_at: sigField.signed_at,
    },
    ip_address: ip,
  });

  return NextResponse.json({
    ok: true,
    signature_id: sigField.id,
    signed_at: sigField.signed_at,
    message: 'Signature saved. Use /api/admin/contracts/export to generate the final document.',
  });
}
