// SMS notification system using the platform's Telnyx number.
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { hydrateProcessEnv } from '@/lib/secrets';

export interface SMSNotification {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function auditSMSDelivery(
  recipient: string,
  messageLength: number,
  result: SMSResult,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const db = await getAdminClient();
    if (!db) return;
    const { error } = await db.from('delivery_logs').insert({
      channel: 'sms',
      recipient,
      status: result.success ? 'pending' : 'failed',
      provider_message_id: result.messageId ?? null,
      error_message: result.error ?? null,
      sent_at: null,
      metadata: {
        provider: 'telnyx',
        message_length: messageLength,
        ...metadata,
      },
    });
    if (error) logger.warn('[SMS] delivery audit insert failed', { error: error.message });
  } catch (error) {
    logger.warn('[SMS] delivery audit unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export class SMSService {
  private static instance: SMSService;
  private constructor() {}

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  isEnabled(): boolean {
    return Boolean(process.env.TELNYX_API_KEY?.trim() && process.env.TELNYX_PHONE_NUMBER?.trim());
  }

  async send(notification: SMSNotification): Promise<SMSResult> {
    await hydrateProcessEnv();
    const cleanPhone = notification.to.replace(/\D/g, '');
    if (cleanPhone.length !== 10 && !(cleanPhone.length === 11 && cleanPhone.startsWith('1'))) {
      const result = { success: false, error: 'Invalid phone number' };
      await auditSMSDelivery(notification.to, notification.message.length, result, notification.metadata);
      return result;
    }

    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    if (!this.isEnabled()) {
      logger.error('SMS not sent — Telnyx messaging is not configured.', new Error('SMS service unavailable'), {
        to: formattedPhone,
        messageLength: notification.message.length,
      });
      const result = { success: false, error: 'SMS service unavailable — Telnyx API key or sending number is missing.' };
      await auditSMSDelivery(formattedPhone, notification.message.length, result, notification.metadata);
      return result;
    }

    try {
      const response = await fetch('https://api.telnyx.com/v2/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY!.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: formattedPhone, from: process.env.TELNYX_PHONE_NUMBER!.trim(), text: notification.message }),
        signal: AbortSignal.timeout(15_000),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || 'SMS send failed';
        logger.error('Telnyx SMS failed', new Error(error), {
          to: formattedPhone,
          status: response.status,
        });
        const result = { success: false, error };
        await auditSMSDelivery(formattedPhone, notification.message.length, result, notification.metadata);
        return result;
      }

      if (!data?.data?.id) throw new Error('Telnyx accepted the request without a message ID');
      logger.info('SMS accepted by Telnyx', { to: formattedPhone, messageId: data.data.id });
      const result = { success: true, messageId: data.data.id };
      await auditSMSDelivery(formattedPhone, notification.message.length, result, notification.metadata);
      return result;
    } catch (error) {
      logger.error('SMS send exception', error as Error, { to: formattedPhone });
      const result = { success: false, error: (error as Error).message };
      await auditSMSDelivery(formattedPhone, notification.message.length, result, notification.metadata);
      return result;
    }
  }

  async sendAssignmentReminder(
    phoneNumber: string,
    assignmentName: string,
    dueDate: string,
  ): Promise<SMSResult> {
    return this.send({
      to: phoneNumber,
      message: `Reminder: ${assignmentName} is due on ${dueDate}. Submit at ${PLATFORM_DEFAULTS.canonicalDomain}/lms/assignments`,
    });
  }

  async sendClassReminder(
    phoneNumber: string,
    className: string,
    startTime: string,
  ): Promise<SMSResult> {
    return this.send({
      to: phoneNumber,
      message: `Your ${className} class starts at ${startTime}. Join at ${PLATFORM_DEFAULTS.canonicalDomain}/lms/live`,
    });
  }

  async sendAchievementNotification(
    phoneNumber: string,
    achievementName: string,
  ): Promise<SMSResult> {
    return this.send({
      to: phoneNumber,
      message: `Achievement unlocked: ${achievementName}! View at ${PLATFORM_DEFAULTS.canonicalDomain}/achievements`,
    });
  }

  async sendCertificateNotification(phoneNumber: string, courseName: string): Promise<SMSResult> {
    return this.send({
      to: phoneNumber,
      message: `Your ${courseName} certificate is ready! Download at ${PLATFORM_DEFAULTS.canonicalDomain}/certificates`,
    });
  }

  async sendEnrollmentConfirmation(phoneNumber: string, courseName: string): Promise<SMSResult> {
    return this.send({
      to: phoneNumber,
      message: `You're enrolled in ${courseName}! Start learning at ${PLATFORM_DEFAULTS.canonicalDomain}/lms/courses`,
    });
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<SMSResult> {
    return this.send({
      to: phoneNumber,
      message: `Your Elevate verification code is: ${code}. Valid for 10 minutes.`,
    });
  }
}

export const smsService = SMSService.getInstance();

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  return smsService.send({ to, message });
}
