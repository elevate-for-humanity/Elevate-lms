'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('\n', '<br />');
}

export async function sendCommunication(formData: FormData) {
  await requireRole(['admin', 'super_admin']);
  const rawRecipients = String(formData.get('recipients') || '');
  const recipients = [...new Set(rawRecipients.split(/[\s,;]+/).map((value) => value.trim().toLowerCase()).filter(Boolean))];
  let subject = String(formData.get('subject') || '').trim();
  let message = String(formData.get('message') || '').trim();
  const templateId = String(formData.get('template_id') || '').trim();

  if (!recipients.length || recipients.length > 25 || recipients.some((email) => !EMAIL.test(email))) {
    redirect('/communications/new?error=invalid-recipients');
  }

  const db = await requireAdminClient();
  if (templateId) {
    const { data: template } = await db.from('email_templates').select('subject,body').eq('id', templateId).maybeSingle();
    if (!template) redirect('/communications/new?error=invalid-template');
    subject ||= template.subject || '';
    message ||= template.body || '';
  }
  if (!subject || !message) redirect('/communications/new?error=missing-content');

  const { data: profiles } = await db.from('profiles').select('id,email').in('email', recipients);
  const userIds = new Map((profiles || []).map((profile) => [String(profile.email).toLowerCase(), profile.id]));
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const { data: communication, error: queueError } = await db.from('communications').insert({
      user_id: userIds.get(recipient) || null,
      type: 'email',
      subject,
      content: message,
      status: 'queued',
    }).select('id').single();
    if (queueError || !communication) {
      failed += 1;
      continue;
    }

    const result = await sendEmail({ to: recipient, subject, text: message, html: escapeHtml(message) });
    const now = new Date().toISOString();
    await db.from('communications').update({
      status: result.success ? 'sent' : 'failed',
      sent_at: result.success ? now : null,
    }).eq('id', communication.id);
    result.success ? sent += 1 : failed += 1;
  }

  revalidatePath('/communications');
  redirect(`/communications?sent=${sent}&failed=${failed}`);
}
