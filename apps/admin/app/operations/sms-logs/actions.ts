'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
import { smsService } from '@/lib/notifications/sms';
import { requireAdminClient } from '@/lib/supabase/admin';

export type SendSmsState = { ok: boolean; message: string };

export async function sendAdminSms(
  _previous: SendSmsState,
  formData: FormData,
): Promise<SendSmsState> {
  const access = await requireRole(['admin', 'staff']);

  const studentId = String(formData.get('studentId') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const consentConfirmed = formData.get('consentConfirmed') === 'yes';
  if (!studentId) return { ok: false, message: 'Select a learner with a stored phone number.' };
  if (!consentConfirmed) return { ok: false, message: 'Confirm that operational texting consent has been verified.' };

  const db = await requireAdminClient();
  const { data: student } = await db.from('profiles').select('id, phone').eq('id', studentId).maybeSingle();
  const to = String(student?.phone ?? '').trim();
  const digits = to.replace(/\D/g, '');

  if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith('1'))) {
    return { ok: false, message: 'Enter a valid 10-digit US phone number.' };
  }
  if (!message) return { ok: false, message: 'Enter a message.' };
  if (message.length > 1_600) {
    return { ok: false, message: 'Messages cannot exceed 1,600 characters.' };
  }

  const result = await smsService.send({
    to,
    message,
    metadata: {
      source: 'admin_manual_outreach',
      student_id: studentId,
      sent_by_user_id: access.user.id,
      consent_confirmed: true,
    },
  });
  revalidatePath('/operations/sms-logs');
  return result.success
    ? { ok: true, message: `Message sent${result.messageId ? ` (${result.messageId})` : ''}.` }
    : { ok: false, message: result.error || 'The message could not be sent.' };
}
