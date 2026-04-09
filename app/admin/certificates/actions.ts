'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { generateCertificateNumber } from '@/lib/partner-workflows/certificates';

export async function issueCertificate(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const recipientName = formData.get('recipientName') as string;
  const email = formData.get('email') as string;
  const courseId = formData.get('courseId') as string;
  const issueDate = formData.get('issueDate') as string;
  const expirationDate = formData.get('expirationDate') as string;
  const signedBy = formData.get('signedBy') as string;
  const notes = formData.get('notes') as string;

  if (!recipientName || !email || !issueDate) {
    redirect('/admin/certificates/issue?error=missing_fields');
  }

  const certNumber = generateCertificateNumber('EFH');

  // Build description from metadata the table doesn't have dedicated columns for
  const descParts: string[] = [];
  if (courseId) descParts.push(`Course: ${courseId}`);
  if (expirationDate) descParts.push(`Expires: ${expirationDate}`);
  if (notes) descParts.push(notes);

  // Insert into issued_certificates — matches actual schema
  const { data: cert, error } = await db
    .from('issued_certificates')
    .insert({
      certificate_number: certNumber,
      recipient_name: recipientName,
      recipient_email: email,
      name: `Certificate for ${recipientName}`,
      description: descParts.length > 0 ? descParts.join(' | ') : null,
      issue_date: issueDate,
      signed_by: signedBy || 'Elevate for Humanity Career & Technical Institute',
      status: 'issued',
    })
    .select('id')
    .single();

  if (error) {
    redirect('/admin/certificates/issue?error=insert_failed');
  }

  // Log to audit
  await db.from('audit_logs').insert({
    user_id: user.id,
    action: 'certificate_issued',
    resource_type: 'certificate',
    resource_id: cert?.id || null,
    details: { recipientName, email, certNumber, courseId: courseId || null },
  }).then(() => {});

  redirect('/admin/certificates?success=issued&cert=' + certNumber);
}

export async function revokeCertificate(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const certId = formData.get('certId') as string;
  const reason = formData.get('reason') as string;

  if (!certId) redirect('/admin/certificates?error=missing_id');

  // Update status and append revocation reason to description
  const { data: existing } = await db
    .from('issued_certificates')
    .select('description')
    .eq('id', certId)
    .single();

  const desc = existing?.description
    ? `${existing.description} | Revoked: ${reason}`
    : `Revoked: ${reason}`;

  await db.from('issued_certificates')
    .update({ status: 'revoked', description: desc })
    .eq('id', certId);

  await db.from('audit_logs').insert({
    user_id: user.id,
    action: 'certificate_revoked',
    resource_type: 'certificate',
    resource_id: certId,
    details: { reason },
  }).then(() => {});

  redirect('/admin/certificates?success=revoked');
}
