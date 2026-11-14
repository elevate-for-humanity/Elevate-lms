import 'server-only';

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export function serializeSignedDocument(payload: Record<string, unknown>) {
  const signatureData = JSON.stringify(payload);
  const documentHash = createHash('sha256').update(signatureData).digest('hex');
  return { signatureData, documentHash };
}

export async function recordOnboardingSignature(
  db: SupabaseClient,
  input: {
    userId: string;
    role: string;
    signatureType: string;
    documentVersion: string;
    payload: Record<string, unknown>;
    signedAt: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const { signatureData, documentHash } = serializeSignedDocument(input.payload);
  const { data, error } = await db.from('onboarding_signatures').insert({
    user_id: input.userId,
    signature_data: signatureData,
    signed_at: input.signedAt,
    role: input.role,
    signature_type: input.signatureType,
    document_version: input.documentVersion,
    document_hash: documentHash,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
    is_valid: true,
  }).select('id,document_hash,signed_at').single();
  if (error) throw new Error(`ELECTRONIC_SIGNATURE_RECORD_FAILED:${error.message}`);
  return { ...data, signatureData, documentHash };
}

export async function recordMouSignature(
  db: SupabaseClient,
  input: {
    userId: string;
    signerName: string;
    signerTitle?: string | null;
    organizationName: string;
    contactEmail?: string | null;
    partnerType: string;
    documentVersion: string;
    payload: Record<string, unknown>;
    signedAt: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const { signatureData, documentHash } = serializeSignedDocument(input.payload);
  const { data, error } = await db.from('mou_signatures').insert({
    user_id: input.userId,
    signature_data: signatureData,
    digital_signature: input.signerName,
    signer_name: input.signerName,
    signer_title: input.signerTitle || null,
    organization_name: input.organizationName,
    contact_name: input.signerName,
    contact_title: input.signerTitle || null,
    contact_email: input.contactEmail || null,
    agreed: true,
    agreed_at: input.signedAt,
    signed_at: input.signedAt,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
    partner_type: input.partnerType,
    mou_version: input.documentVersion,
    signature_path: `sha256:${documentHash}`,
  }).select('id,signed_at,mou_version,signature_path').single();
  if (error) throw new Error(`MOU_SIGNATURE_RECORD_FAILED:${error.message}`);
  return { ...data, signatureData, documentHash };
}
