import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { contactRateLimit } from '@/lib/rate-limit';
import { applicationSchema } from '@/lib/api/validation-schemas';
import { sendEmail } from '@/lib/email/resend';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { getRoutingRecommendations } from '@/lib/automation/shop-routing';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const ADMIN_SMS = process.env.ADMIN_SMS_GATEWAY || '';

export const POST = withRateLimit(
  async (req: Request) => {
    try {
      const contentType = req.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await req.json();
      } else {
        const formData = await req.formData();
        data = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          program: formData.get('program'),
          funding: formData.get('funding'),
        };
      }
      
      const validatedData = applicationSchema.parse(data);

      const { program, funding, name, email, phone, pathway_slug, source } = validatedData;
      const eligible = funding !== 'Self Pay' && program !== 'Not Sure';

      // Split name into first and last
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
    
      // Build insert object - only include pathway_slug/source if migration has been run
      const insertData: Record<string, any> = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        city: 'Not provided',
        zip: '00000',
        program_interest: program,
        status: 'pending',
        support_notes: `Funding: ${funding}. ${eligible ? 'Prescreen pass' : 'Manual review'}${pathway_slug ? `. Pathway: ${pathway_slug}` : ''}`,
      };

      // Try with new columns first, fall back without them
      let application, error;
      if (pathway_slug || source) {
        const result = await supabase.from('applications').insert({
          ...insertData,
          pathway_slug: pathway_slug || null,
          source: source || 'direct',
        }).select('id').single();
        
        if (result.error?.message?.includes('column') || result.error?.code === '42703') {
          // Columns don't exist yet, insert without them
          const fallback = await supabase.from('applications').insert(insertData).select('id').single();
          application = fallback.data;
          error = fallback.error;
        } else {
          application = result.data;
          error = result.error;
        }
      } else {
        const result = await supabase.from('applications').insert(insertData).select('id').single();
        application = result.data;
        error = result.error;
      }

      if (error) {
        logger.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Failed to submit application. Please call 317-314-3757 for assistance.' },
          { status: 500 }
        );
      }

      await auditLog({
        actorRole: 'student',
        action: AuditAction.CASE_CREATED,
        entity: AuditEntity.APPLICATION,
        entityId: application?.id,
        metadata: { program, funding, email, eligible },
      });

      // Trigger routing automation for apprenticeship programs (non-blocking)
      if (process.env.AUTOMATION_ENABLE_TRIGGERS !== 'false' && application?.id) {
        if (program?.toLowerCase().includes('apprentice')) {
          getRoutingRecommendations(application.id).catch((err) => {
            logger.error('Routing automation error (non-blocking):', err);
          });
        }
      }

      // Send confirmation email to applicant
      await sendEmail({
        to: email,
        subject: 'Application Received - Elevate for Humanity',
        html: `
          <h2>Thank you for your application, ${firstName}!</h2>
          <p>We have received your application for <strong>${program}</strong>.</p>
          <p>Our team will review your application and contact you within 2-3 business days.</p>
          <p><strong>What's next?</strong></p>
          <ul>
            <li>Our admissions team will review your application</li>
            <li>You'll receive a call or email to discuss next steps</li>
            <li>If approved, we'll help you get started right away</li>
          </ul>
          <p>Questions? Call us at <a href="tel:317-314-3757">317-314-3757</a></p>
          <p>Best regards,<br>Elevate for Humanity Team</p>
        `,
      });

      // Send notification email to admin
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Application: ${firstName} ${lastName} - ${program}`,
        html: `
          <h2>New Application Received</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="tel:${phone}">${phone}</a></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Program</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${program}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Funding</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${funding}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Pre-screen</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${eligible ? '✅ Pass' : '⚠️ Manual Review'}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="https://www.elevateforhumanity.org/admin/applications" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a></p>
        `,
      });

      // Send SMS alert via AT&T email gateway
      await sendEmail({
        to: ADMIN_SMS,
        subject: 'New App',
        html: `${firstName} ${lastName}\n${program}\n${phone}`,
      });

      // Trigger routing automation asynchronously (non-blocking)
      // On error: creates review_queue item, never blocks user flow
      if (application?.id) {
        try {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/automation/routing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: application.id, program }),
          }).catch((err) => {
            console.error('[apply] Routing automation trigger failed (non-fatal):', err);
          });
        } catch (triggerError) {
          // Never block user flow - log and continue
          console.error('[apply] Routing automation trigger error (non-fatal):', triggerError);
        }
      }

      if (contentType?.includes('application/json')) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.redirect(
        new URL('/apply/success', req.url),
        { status: 303 }
      );
    } catch (err: any) {
      logger.error('Apply route error:', err);
      
      // Handle validation errors specifically
      if (err?.name === 'ZodError' || err?.issues) {
        const issues = err.issues || err.errors || [];
        const fieldErrors = issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ');
        return NextResponse.json(
          { error: `Please fix: ${fieldErrors}` },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Submission failed. Please call 317-314-3757.' },
        { status: 500 }
      );
    }
  },
  { limiter: contactRateLimit, skipOnMissing: true }
);
