/**
 * Email Dispatch Edge Function
 * Handles automated email sending for campaigns, notifications, and transactional emails
 *
 * Copyright (c) 2025 Elevate for Humanity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  from?: string;
  replyTo?: string;
  campaignId?: string;
  userId?: string;
  orgId?: string;
}

interface EmailProvider {
  send(request: EmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(
    request: EmailRequest,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const recipients = Array.isArray(request.to) ? request.to : [request.to];

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: recipients.map((email) => ({
            to: [{ email }],
            dynamic_template_data: request.templateData || {},
          })),
          from: {
            email: request.from || 'noreply@www.elevateforhumanity.org',
            name: 'Elevate for Humanity',
          },
          reply_to: request.replyTo ? { email: request.replyTo } : undefined,
          subject: request.subject,
          content: [
            {
              type: 'text/html',
              value: request.html || request.text || '',
            },
          ],
          template_id: request.template,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid error: ${error}`);
      }

      return {
        success: true,
        messageId: response.headers.get('x-message-id') || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(
    request: EmailRequest,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const recipients = Array.isArray(request.to) ? request.to : [request.to];

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: request.from || 'noreply@www.elevateforhumanity.org',
          to: recipients,
          subject: request.subject,
          html: request.html,
          text: request.text,
          reply_to: request.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend error: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

async function logEmail(
  request: EmailRequest,
  result: { success: boolean; messageId?: string; error?: string },
) {
  try {
    const recipients = Array.isArray(request.to) ? request.to : [request.to];

    await supabase.from('email_logs').insert({
      org_id: request.orgId,
      user_id: request.userId,
      campaign_id: request.campaignId,
      recipients,
      subject: request.subject,
      status: result.success ? 'sent' : 'failed',
      message_id: result.messageId,
      error: result.error,
      metadata: {
        template: request.template,
        provider: SENDGRID_API_KEY ? 'sendgrid' : 'resend',
      },
    });
  } catch (error) {
    console.error('[email-dispatch] Failed to log email delivery:', error instanceof Error ? error.message : error);
  }
}

async function processEmailQueue() {
  try {
    // Fetch pending emails from queue
    const { data: queuedEmails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;

    if (!queuedEmails || queuedEmails.length === 0) {
      return { processed: 0 };
    }

    const provider = SENDGRID_API_KEY
      ? new SendGridProvider(SENDGRID_API_KEY)
      : RESEND_API_KEY
        ? new ResendProvider(RESEND_API_KEY)
        : null;

    if (!provider) {
      throw new Error('No email provider configured');
    }

    let processed = 0;
    for (const email of queuedEmails) {
      // Mark as processing
      await supabase.from('email_queue').update({ status: 'processing' }).eq('id', email.id);

      // Send email
      const result = await provider.send({
        to: email.recipient,
        subject: email.subject,
        html: email.html,
        text: email.text,
        template: email.template,
        templateData: email.template_data,
        from: email.from_email,
        replyTo: email.reply_to,
        campaignId: email.campaign_id,
        userId: email.user_id,
        orgId: email.org_id,
      });

      // Update queue status
      await supabase
        .from('email_queue')
        .update({
          status: result.success ? 'sent' : 'failed',
          message_id: result.messageId,
          error: result.error,
          sent_at: result.success ? new Date().toISOString() : null,
        })
        .eq('id', email.id);

      // Log the email
      await logEmail(
        {
          to: email.recipient,
          subject: email.subject,
          html: email.html,
          text: email.text,
          template: email.template,
          templateData: email.template_data,
          campaignId: email.campaign_id,
          userId: email.user_id,
          orgId: email.org_id,
        },
        result,
      );

      processed++;
    }

    return { processed };
  } catch (error: any) {
    throw error;
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'send';

    if (action === 'process-queue') {
      // Process queued emails (called by cron)
      const result = await processEmailQueue();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Direct send
    const emailRequest: EmailRequest = await req.json();

    // Validate request
    if (!emailRequest.to || !emailRequest.subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!emailRequest.html && !emailRequest.text && !emailRequest.template) {
      return new Response(JSON.stringify({ error: 'Must provide html, text, or template' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Select provider
    const provider = SENDGRID_API_KEY
      ? new SendGridProvider(SENDGRID_API_KEY)
      : RESEND_API_KEY
        ? new ResendProvider(RESEND_API_KEY)
        : null;

    if (!provider) {
      return new Response(JSON.stringify({ error: 'No email provider configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send email
    const result = await provider.send(emailRequest);

    // Log email
    await logEmail(emailRequest, result);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
