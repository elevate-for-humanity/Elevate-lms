

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    if (!resend) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const body = await req.json();

    // Get recipient list
    const recipients = await getRecipients(supabase, body.recipientList);

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients found' },
        { status: 400 }
      );
    }

    // Send emails
    const results = [];
    for (const recipient of recipients) {
      try {
        // Render template with variables
        const variables = {
          firstName: recipient.first_name || 'there',
          lastName: recipient.last_name || '',
          email: recipient.email,
          programName: recipient.program_name || 'your program',
          portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/student`,
          ...recipient.custom_variables,
        };

        let html = body.customHtml;
        let subject = body.subject;

        // Replace variables
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, String(value));
          subject = subject.replace(regex, String(value));
        });

        // Send email
        const data = await resend.emails.send({
          from: `${body.fromName} <${body.fromEmail}>`,
          to: recipient.email,
          subject,
          html,
          reply_to: body.replyTo,
        });

        results.push({ email: recipient.email, success: true, data });

        // Log send
        await supabase.from('email_logs').insert({
          campaign_id: body.campaignId,
          recipient_email: recipient.email,
          recipient_id: recipient.id,
          subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      } catch (error) { 
        logger.error(
          `Error sending to ${recipient.email}:`,
          error instanceof Error ? error : new Error(String(error))
        );
        results.push({
          email: recipient.email,
          success: false,
          error: toErrorMessage(error),
        });

        // Log failure
        await supabase.from('email_logs').insert({
          campaign_id: body.campaignId,
          recipient_email: recipient.email,
          recipient_id: recipient.id,
          subject: body.subject,
          status: 'failed',
          error_message: toErrorMessage(error),
        });
      }
    }

    // Update campaign status
    if (body.campaignId) {
      await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          total_sent: results.filter((r) => r.success).length,
        })
        .eq('id', body.campaignId);
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) { 
    logger.error(
      'Error sending campaign:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

async function getRecipients(supabase: any, listType: string) {
  let query;

  switch (listType) {
    case 'all-students':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .not('email', 'is', null);
      break;

    case 'active-students':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .eq('status', 'active')
        .not('email', 'is', null);
      break;

    case 'new-applicants':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .eq('status', 'applicant')
        .not('email', 'is', null);
      break;

    case 'program-completers':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name, program_name')
        .eq('status', 'completed')
        .not('email', 'is', null);
      break;

    case 'employers':
      query = supabase
        .from('employers')
        .select(
          'id, email, contact_name as first_name, company_name as last_name'
        )
        .not('email', 'is', null);
      break;

    case 'workone':
      query = supabase
        .from('partners')
        .select(
          'id, email, contact_name as first_name, organization as last_name'
        )
        .eq('type', 'workone')
        .not('email', 'is', null);
      break;

    default:
      return [];
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching recipients:', error);
    return [];
  }

  return data || [];
}
export const POST = withApiAudit('/api/email/campaigns/send', _POST);
