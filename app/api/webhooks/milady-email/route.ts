import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
/**
 * Milady Email Forwarding Webhook
 * 
 * Receives emails from Milady (via email forwarding service like SendGrid Inbound Parse)
 * and forwards the Milady login credentials to the student.
 * 
 * Setup: Configure Milady to send enrollment emails to: milady-inbound@elevateforhumanity.org
 * Then set up SendGrid/Resend inbound parse to POST to this endpoint.
 */


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Verify shared secret — set MILADY_WEBHOOK_SECRET and append as ?secret=<value>
    // in the SendGrid/Resend inbound parse URL configuration.
    const webhookSecret = process.env.MILADY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const url = new URL((request as any).url || 'http://localhost');
      const provided = url.searchParams.get('secret')
        || (request.headers as any).get?.('x-webhook-secret')
        || '';
      const { timingSafeEqual } = await import('crypto');
      const match = provided.length === webhookSecret.length &&
        timingSafeEqual(Buffer.from(provided), Buffer.from(webhookSecret));
      if (!match) {
        logger.error('[milady-email] Unauthorized request — secret mismatch');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      logger.warn('[milady-email] MILADY_WEBHOOK_SECRET not set — endpoint is unauthenticated');
    }

  try {
    const formData = await request.formData();
    
    // Extract email data from inbound parse
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const html = formData.get('html') as string;
    const text = formData.get('text') as string;

    // Verify it's from Milady
    if (!from?.toLowerCase().includes('milady')) {
      logger.info('[milady-email] Ignoring non-Milady email from:', from);
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Extract student email from the email content or subject
    // Milady typically includes the student email in the body
    const studentEmailMatch = html?.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    let studentEmail = studentEmailMatch?.[1];

    // If not found in body, check if it was CC'd or in headers
    const envelope = formData.get('envelope') as string;
    if (!studentEmail && envelope) {
      try {
        const envelopeData = JSON.parse(envelope);
        // Look for student email in envelope
        studentEmail = envelopeData.to?.find((e: string) => 
          !e.includes('elevate') && !e.includes('milady')
        );
      } catch (err) {
          logger.error("[milady-email] Envelope parse error", err instanceof Error ? err : undefined);
        }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find student by email in our system
    let student = null;
    if (studentEmail) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', studentEmail.toLowerCase())
        .single();
      student = data;
    }

    // Log the inbound email
    await supabase.from('milady_email_logs').insert({
      from_email: from,
      to_email: to,
      subject,
      student_email: studentEmail,
      student_id: student?.id,
      forwarded: !!student,
      raw_content: text?.substring(0, 5000),
      created_at: new Date().toISOString(),
    });

    // If we found the student, forward the email
    if (student && studentEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
      
      // Forward the Milady email to the student
      await fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: studentEmail,
          subject: `Your Milady Login Credentials - ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #ea580c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">Your Milady Account is Ready!</h1>
              </div>
              
              <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb;">
                <p style="color: #334155; margin-bottom: 16px;">
                  Hi ${student.full_name || 'Student'},
                </p>
                <p style="color: #334155; margin-bottom: 16px;">
                  Great news! Your Milady account has been created. Below is the email from Milady with your login information:
                </p>
                
                <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #7c3aed; margin-top: 0;">📧 Message from Milady:</h3>
                  ${html || `<pre style="white-space: pre-wrap;">${text}</pre>`}
                </div>
                
                <div style="background: #f9fafb; border-left: 4px solid #e5e7eb; padding: 16px; margin: 20px 0;">
                  <h4 style="color: #92400e; margin: 0 0 8px 0;">⚠️ Next Step Required</h4>
                  <p style="color: #78350f; margin: 0;">
                    After you log into Milady, return to your Elevate dashboard and mark "Milady Enrollment Complete" to continue your onboarding.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${siteUrl}/apprentice" style="display: inline-block; background: #ea580c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Go to Dashboard →
                  </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                  Questions? Call us at <a href="tel:3173143757" style="color: #2563eb;">(317) 314-3757</a>
                </p>
              </div>
            </div>
          `,
        }),
      });

      // Update student record to mark Milady email received
      await supabase
        .from('student_onboarding')
        .upsert({
          student_id: student.id,
          milady_credentials_received: true,
          milady_credentials_received_at: new Date().toISOString(),
        }, { onConflict: 'student_id' });

      logger.info('[milady-email] Forwarded to student:', studentEmail);
    }

    return NextResponse.json({ ok: true, forwarded: !!student });
  } catch (error: any) {
    logger.error('[milady-email] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/webhooks/milady-email', _POST, { actor_type: 'webhook', skip_body: true });
