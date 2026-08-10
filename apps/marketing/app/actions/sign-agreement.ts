'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { recordAgreementAcceptance, type AgreementType } from '@/lib/legal/recordAgreementAcceptance';

export async function signAgreement(data: {
  agreementType: string;
  agreementVersion: string;
  method: 'checkbox' | 'typed' | 'drawn';
  signature?: string;
  typedName?: string;
  studentId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: 'You must be signed in to sign this agreement.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, tenant_id, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    || requestHeaders.get('x-real-ip')
    || requestHeaders.get('cf-connecting-ip')
    || '0.0.0.0';
  const userAgent = requestHeaders.get('user-agent') || 'unknown';
  const signerName = String(data.typedName || profile?.full_name || user.email).trim();

  const result = await recordAgreementAcceptance({
    supabase,
    userId: user.id,
    userEmail: user.email,
    userRole: String(profile?.role || 'student'),
    agreementType: data.agreementType as AgreementType,
    documentVersion: data.agreementVersion || '1.0',
    signerName,
    signerEmail: user.email,
    signatureMethod: data.method,
    signatureTyped: data.method === 'typed' ? signerName : undefined,
    signatureData: data.method === 'drawn' ? data.signature : undefined,
    ipAddress,
    userAgent,
    context: 'onboarding',
    organizationId: profile?.organization_id || undefined,
    tenantId: profile?.tenant_id || undefined,
  });

  return result.success
    ? { success: true, id: result.id, alreadyExists: result.alreadyExists, timestamp: new Date().toISOString() }
    : { success: false, error: result.error || 'Agreement could not be recorded.' };
}
