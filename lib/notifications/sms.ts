// SMS notification system using the platform's active Twilio business number.
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { hydrateProcessEnv } from '@/lib/secrets';
import { resolveTwilioSendingNumber, sendTwilioMessage, twilioAuthorization } from '@/lib/phone/twilio';

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
        provider: 'twilio',
        message_length: messageLength,
        ...metadata,
      },
    });
    if (error) logger.warn('[SMS] delivery audit insert failed');
  } catch (error) {
    logger.warn('[SMS] delivery audit unavailable');
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

  async sendingNumber(): Promise<string | null> {
    await hydrateProcessEnv();
    try { twilioAuthorization(); } catch { return null; }
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const db = await getAdminClient();
    return db ? resolveTwilioSendingNumber(db) : null;
  }

  async isEnabled(): Promise<boolean> {
    return Boolean(await this.sendingNumber());
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

    const sendingNumber = await this.sendingNumber();
    if (!sendingNumber) {
      logger.error('SMS not sent — Twilio messaging is not configured.', new Error('SMS service unavailable'), {
        messageLength: notification.message.length,
      });
      const result = { success: false, error: 'SMS service unavailable — Twilio credentials or active business sender is missing.' };
      await auditSMSDelivery(formattedPhone, notification.message.length, result, notification.metadata);
      return result;
    }

    try {
      const accepted = await sendTwilioMessage({ to: formattedPhone, from: sendingNumber, body: notification.message });
      logger.info('SMS accepted by Twilio');
      const result = { success: true, messageId: accepted.messageId };
      await auditSMSDelivery(formattedPhone, notification.message.length, result, notification.metadata);
      return result;
    } catch (error) {
      logger.error('SMS send outcome could not be confirmed');
      const result = { success: false, error: 'SMS send outcome could not be confirmed' };
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
