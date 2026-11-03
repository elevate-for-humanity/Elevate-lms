import { requireAdminClient } from '@/lib/supabase/admin';
/** A credential is verifiable only while its exam remains valid and approval remains active. */
export async function nativeCertificate(number: string) {
  if (!/^EFH-608-[A-F0-9]{32}$/.test(number)) return null;
  const db = await requireAdminClient();
  const { data: a, error } = await db
    .from('epa_native_attempts')
    .select(
      'id,session_id,candidate_id,candidate_name,candidate_city,exam_type,certificate_number,certificate_issued_at,directory_opt_out',
    )
    .eq('certificate_number', number)
    .maybeSingle();
  if (error) throw new Error('Credential registry unavailable');
  if (!a) return null;
  const [{ data: session, error: sessionError }, { data: authority, error: authorityError }] =
    await Promise.all([
      db
        .from('exam_sessions')
        .select('result,status,review_status')
        .eq('id', a.session_id)
        .maybeSingle(),
      db
        .from('epa_certification_authority')
        .select('legal_name,status,approved_at')
        .eq('id', 'elevate')
        .maybeSingle(),
    ]);
  if (sessionError || authorityError) throw new Error('Credential verification unavailable');
  if (
    !session ||
    !authority ||
    authority.status !== 'approved' ||
    session.result !== 'pass' ||
    session.status !== 'completed' ||
    session.review_status !== 'clear'
  )
    return null;
  return { ...a, issuer: authority.legal_name, approvalDate: authority.approved_at };
}
