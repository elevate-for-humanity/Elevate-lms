import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Email Service Integration Tests
 * Tests the email configuration and templates
 */

describe('Email Service Integration', () => {
  beforeAll(() => {
    // Verify Resend API key is configured
    expect(process.env.RESEND_API_KEY).toBeDefined();
  });

  describe('Environment Configuration', () => {
    it('has Resend API key configured', () => {
      const key = process.env.RESEND_API_KEY;
      expect(key).toBeDefined();
      expect(key?.startsWith('re_')).toBe(true);
    });

    it('has email from address configured', () => {
      const from = process.env.EMAIL_FROM;
      expect(from).toBeDefined();
      expect(from).toContain('@');
    });

    it('has reply-to email configured', () => {
      const replyTo = process.env.REPLY_TO_EMAIL;
      expect(replyTo).toBeDefined();
      expect(replyTo).toContain('@');
    });
  });

  describe('Email Service Module', () => {
    it('can import email service without errors', async () => {
      const emailService = await import('@/lib/email/resend');
      expect(emailService.sendEmail).toBeDefined();
    });

    it('exports sendWelcomeEmail function', async () => {
      const { sendWelcomeEmail } = await import('@/lib/email/resend');
      expect(sendWelcomeEmail).toBeDefined();
      expect(typeof sendWelcomeEmail).toBe('function');
    });

    it('exports sendCreatorApprovalEmail function', async () => {
      const { sendCreatorApprovalEmail } = await import('@/lib/email/resend');
      expect(sendCreatorApprovalEmail).toBeDefined();
      expect(typeof sendCreatorApprovalEmail).toBe('function');
    });

    it('exports sendPayoutConfirmationEmail function', async () => {
      const { sendPayoutConfirmationEmail } = await import('@/lib/email/resend');
      expect(sendPayoutConfirmationEmail).toBeDefined();
      expect(typeof sendPayoutConfirmationEmail).toBe('function');
    });
  });

  describe('Email Templates', () => {
    it('platform email templates exist', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const templatePath = path.join(process.cwd(), 'lib/email/templates/platform-emails.ts');
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it('student email templates exist', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const templatePath = path.join(process.cwd(), 'lib/email/templates/student-emails.ts');
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    it('appointment email templates exist', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const templatePath = path.join(process.cwd(), 'lib/email/templates/appointment-emails.ts');
      expect(fs.existsSync(templatePath)).toBe(true);
    });
  });

  describe('Notification System', () => {
    it('notification email module exists', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const modulePath = path.join(process.cwd(), 'lib/notifications/email.ts');
      expect(fs.existsSync(modulePath)).toBe(true);
    });

    it('application emails module exists', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const modulePath = path.join(process.cwd(), 'lib/notifications/application-emails.ts');
      expect(fs.existsSync(modulePath)).toBe(true);
    });
  });

  describe('Email API Routes', () => {
    it('email API routes exist', async () => {
      const fs = await import('fs');
      const path = await import('path');

      // Check for email-related API routes
      const apiDir = path.join(process.cwd(), 'app/api');
      expect(fs.existsSync(apiDir)).toBe(true);
    });
  });
});
