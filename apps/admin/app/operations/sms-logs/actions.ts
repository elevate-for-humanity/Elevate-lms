'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
import { smsService } from '@/lib/notifications/sms';

export type SendSmsState = { ok: boolean; message: string };

export async function sendAdminSms(
  _previous: SendSmsState,
  formData: FormData,
): Promise<SendSmsState> {
  await requireRole(['admin', 'staff']);

  const to = String(formData.get('to') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const digits = to.replace(/\D/g, '');

  if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith('1'))) {
    return { ok: false, message: 'Enter a valid 10-digit US phone number.' };
  }
  if (!message) return { ok: false, message: 'Enter a message.' };
  if (message.length > 1_600) {
    return { ok: false, message: 'Messages cannot exceed 1,600 characters.' };
  }

  const result = await smsService.send({ to, message });
  revalidatePath('/operations/sms-logs');
  return result.success
    ? { ok: true, message: `Message sent${result.messageId ? ` (${result.messageId})` : ''}.` }
    : { ok: false, message: result.error || 'The message could not be sent.' };
}
