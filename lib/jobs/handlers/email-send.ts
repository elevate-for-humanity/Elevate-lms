import { createClient } from '@/lib/supabase/server';
import { createAdminClient as createSupabaseClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { ProvisioningJob } from '../queue';

/**
 * STEP 6B: Async email send job handler
 * 
 * Email types:
 * - license_activated: Welcome email with license details
 * - license_suspended: Notification of suspension
 * - license_expiring: Warning before expiry
 * - payment_failed: Payment retry notification
 */

export type EmailType = 
  | 'license_activated'
  | 'license_suspended'
  | 'license_expiring'
  | 'payment_failed'
  | 'welcome'
  | 'password_reset';

interface EmailPayload {
  emailType: EmailType;
  to: string;
  subject?: string;
  templateData: Record<string, unknown>;
  tenantId?: string;
}

export async function processEmailSend(job: ProvisioningJob): Promise<void> {
  const supabase = await createClient();
  const payload = job.payload as EmailPayload;
  
  if (!payload.to || !payload.emailType) {
    throw new Error('Missing required fields: to, emailType');
  }
  
  const startTime = Date.now();
  
  try {
    // Send email via configured provider
    await sendEmail(payload);
    
    const duration = Date.now() - startTime;
    
    // Log success
    await supabase.from('provisioning_events').insert({
      correlation_id: job.correlation_id,
      tenant_id: job.tenant_id,
      step: 'email_sent',
      status: 'completed',
      metadata: {
        jobId: job.id,
        emailType: payload.emailType,
        to: maskEmail(payload.to),
        durationMs: duration,
      },
    });
    
    logger.info('Email sent', {
      emailType: payload.emailType,
      to: maskEmail(payload.to),
      correlationId: job.correlation_id,
      durationMs: duration,
    });
  } catch (error) {
    // Log failure
    await supabase.from('provisioning_events').insert({
      correlation_id: job.correlation_id,
      tenant_id: job.tenant_id,
      step: 'email_failed',
      status: 'failed',
      error: 'Operation failed',
      metadata: {
        jobId: job.id,
        emailType: payload.emailType,
        to: maskEmail(payload.to),
      },
    });
    
    throw error;
  }
}

/**
 * Send email via configured provider (Resend, SendGrid, etc.)
 */
async function sendEmail(payload: EmailPayload): Promise<void> {
  const { emailType, to, templateData } = payload;
  
  // Get template content
  const template = getEmailTemplate(emailType, templateData);
  
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  if (sendgridApiKey) {
    const fromRaw = process.env.EMAIL_FROM || 'Elevate for Humanity <noreply@elevateforhumanity.org>';
    const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
    const from = fromMatch
      ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() }
      : { email: fromRaw.trim() };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from,
        subject: template.subject,
        content: [{ type: 'text/html', value: template.html }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    return;
  }
  
  // Fallback: log email (development)
  logger.info('Email would be sent (no provider configured)', {
    to: maskEmail(to),
    subject: template.subject,
    emailType,
  });
}

/**
 * Get email template by type
 */
function getEmailTemplate(
  emailType: EmailType, 
  data: Record<string, unknown>
): { subject: string; html: string } {
  const templates: Record<EmailType, { subject: string; html: string }> = {
    license_activated: {
      subject: 'Your Elevate LMS License is Active',
      html: `
        <h1>Welcome to Elevate LMS!</h1>
        <p>Your license has been activated.</p>
        <p>Plan: ${data.plan || 'Professional'}</p>
        <p>Tenant: ${data.tenantName || 'Your Organization'}</p>
        <p><a href="${data.loginUrl || 'https://www.elevateforhumanity.org/login'}">Login to your dashboard</a></p>
      `,
    },
    license_suspended: {
      subject: 'Action Required: Your Elevate LMS License is Suspended',
      html: `
        <h1>License Suspended</h1>
        <p>Your license has been suspended due to: ${data.reason || 'payment issue'}</p>
        <p>Please update your billing information to restore access.</p>
        <p><a href="${data.billingUrl || 'https://www.elevateforhumanity.org/billing'}">Update Billing</a></p>
      `,
    },
    license_expiring: {
      subject: 'Your Elevate LMS License is Expiring Soon',
      html: `
        <h1>License Expiring</h1>
        <p>Your license will expire on ${data.expiryDate || 'soon'}.</p>
        <p>Renew now to avoid interruption.</p>
        <p><a href="${data.renewUrl || 'https://www.elevateforhumanity.org/renew'}">Renew License</a></p>
      `,
    },
    payment_failed: {
      subject: 'Payment Failed - Action Required',
      html: `
        <h1>Payment Failed</h1>
        <p>We were unable to process your payment.</p>
        <p>Please update your payment method to continue service.</p>
        <p><a href="${data.billingUrl || 'https://www.elevateforhumanity.org/billing'}">Update Payment</a></p>
      `,
    },
    welcome: {
      subject: 'Welcome to Elevate LMS',
      html: `
        <h1>Welcome!</h1>
        <p>Thank you for joining Elevate LMS.</p>
        <p><a href="${data.loginUrl || 'https://www.elevateforhumanity.org/login'}">Get Started</a></p>
      `,
    },
    password_reset: {
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <p><a href="${data.resetUrl}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    },
  };
  
  return templates[emailType] || templates.welcome;
}

/**
 * Mask email for logging (privacy)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 
    ? local[0] + '***' + local[local.length - 1]
    : '***';
  return `${maskedLocal}@${domain}`;
}
