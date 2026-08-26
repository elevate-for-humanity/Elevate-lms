// SMS notification system using Twilio
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface SMSNotification {
  to: string;
  message: string;
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
): Promise<void> {
  try {
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const db = await getAdminClient();
    if (!db) return;
    const { error } = await db.from('delivery_logs').insert({
      channel: 'sms',
      recipient,
      status: result.success ? 'sent' : 'failed',
      provider_message_id: result.messageId ?? null,
      error_message: result.error ?? null,
      sent_at: result.success ? new Date().toISOString() : null,
      metadata: {
        provider: 'twilio',
        message_length: messageLength,
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
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private fromNumber: string | undefined;
  private enabled: boolean;

  private constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.enabled = !!(this.accountSid && this.authToken && this.fromNumber);
  }

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async send(notification: SMSNotification): Promise<SMSResult> {
    const cleanPhone = notification.to.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      const result = { success: false, error: 'Invalid phone number' };
      await auditSMSDelivery(notification.to, notification.message.length, result);
      return result;
    }

    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    if (!this.enabled) {
      logger.error('SMS not sent — Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.', new Error('SMS service unavailable'), {
        to: formattedPhone,
        messageLength: notification.message.length,
      });
      const result = { success: false, error: 'SMS service unavailable — Twilio not configured' };
      await auditSMSDelivery(formattedPhone, notification.message.length, result);
      return result;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: this.fromNumber!,
          Body: notification.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('Twilio SMS failed', new Error(data.message || 'Unknown error'), {
          to: formattedPhone,
          status: response.status,
        });
        const result = { success: false, error: data.message || 'SMS send failed' };
        await auditSMSDelivery(formattedPhone, notification.message.length, result);
        return result;
      }

      logger.info('SMS sent successfully', { to: formattedPhone, messageId: data.sid });
      const result = { success: true, messageId: data.sid };
      await auditSMSDelivery(formattedPhone, notification.message.length, result);
      return result;
    } catch (error) {
      logger.error('SMS send exception', error as Error, { to: formattedPhone });
      const result = { success: false, error: (error as Error).message };
      await auditSMSDelivery(formattedPhone, notification.message.length, result);
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
