'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { generateCertificateNumber } from '@/lib/partner-workflows/certificates';

export async function issueCertificate(formData: FormData) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const recipientName = formData.get('recipientName') as string;
  const email = formData.get('email') as string;
  const templateId = formData.get('templateId') as string;
  const courseId = formData.get('courseId') as string;
  const issueDate = formData.get('issueDate') as string;
  const expirationDate = formData.get('expirationDate') as string;
  const signedBy = formData.get('signedBy') as string;
  const notes = formData.get('notes') as string;
  const sendEmail = formData.get('sendEmail') === 'on';

  if (!recipientName || !email || !issueDate) {
    redirect('/admin/certificates/issue?error=missing_fields');
  }

  const certNumber = generateCertificateNumber('EFH');

  // Look up student by email
  const { data: student } = await db
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .single();

  // Insert into issued_certificates
  const { data: cert, error } = await db
    .from('issued_certificates')
    .insert({
      certificate_number: certNumber,
      recipient_name: recipientName,
      recipient_email: email,
      student_id: student?.id || null,
      template_id: templateId || null,
      course_id: courseId || null,
      issue_date: issueDate,
      expiration_date: expirationDate || null,
      signed_by: signedBy || 'Elevate for Humanity Career & Technical Institute',
      notes: notes || null,
      status: 'issued',
      issued_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    // Fallback: try certificates table
    const { data: cert2, error: err2 } = await db
      .from('certificates')
      .insert({
        certificate_number: certNumber,
        student_name: recipientName,
        student_email: email,
        student_id: student?.id || null,
        template_id: templateId || null,
        course_id: courseId || null,
        issued_date: issueDate,
        expiry_date: expirationDate || null,
        signed_by: signedBy || 'Elevate for Humanity Career & Technical Institute',
        notes: notes || null,
        status: 'active',
        issued_by: user.id,
      })
      .select('id')
      .single();

    if (err2) {
      redirect('/admin/certificates/issue?error=insert_failed');
    }
  }

  // Log to audit
  await db.from('audit_logs').insert({
    user_id: user.id,
    action: 'certificate_issued',
    resource_type: 'certificate',
    resource_id: cert?.id || null,
    details: { recipientName, email, certNumber },
  }).then(() => {});

  redirect('/admin/certificates?success=issued&cert=' + certNumber);
}

export async function revokeCertificate(formData: FormData) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const certId = formData.get('certId') as string;
  const reason = formData.get('reason') as string;

  if (!certId) redirect('/admin/certificates?error=missing_id');

  // Try both tables
  await db.from('issued_certificates').update({ status: 'revoked', revocation_reason: reason }).eq('id', certId);
  await db.from('certificates').update({ status: 'revoked', notes: `Revoked: ${reason}` }).eq('id', certId);

  await db.from('audit_logs').insert({
    user_id: user.id,
    action: 'certificate_revoked',
    resource_type: 'certificate',
    resource_id: certId,
    details: { reason },
  }).then(() => {});

  redirect('/admin/certificates?success=revoked');
}
