/**
 * Email Configuration
 * Supports Resend (recommended) and SendGrid
 */

export type EmailProvider = 'resend' | 'sendgrid' | 'smtp';

export interface EmailConfig {
  provider: EmailProvider;
  from: string;
  replyTo?: string;
}

// Get email configuration from environment
export function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'resend') as EmailProvider;
  
  return {
    provider,
    from: process.env.EMAIL_FROM || 'Elevate for Humanity <info@elevateforhumanity.org>',
    replyTo: process.env.EMAIL_REPLY_TO || 'info@elevateforhumanity.org',
  };
}

// Validate email configuration
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const provider = process.env.EMAIL_PROVIDER;
  
  if (provider === 'resend' && !process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required when using Resend provider');
  }
  
  if (provider === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY is required when using SendGrid provider');
  }
  
  if (provider === 'smtp') {
    if (!process.env.SMTP_HOST) errors.push('SMTP_HOST is required');
    if (!process.env.SMTP_PORT) errors.push('SMTP_PORT is required');
    if (!process.env.SMTP_USER) errors.push('SMTP_USER is required');
    if (!process.env.SMTP_PASS) errors.push('SMTP_PASS is required');
  }
  
  return { valid: errors.length === 0, errors };
}
