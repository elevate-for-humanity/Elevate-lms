// PUBLIC ROUTE: public contact form

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// Validation schema for contact form
const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(200),
  phone: z.string().max(50).optional().or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters').max(4000),
  program: z.string().max(120).optional().or(z.literal('')),
  role: z.string().max(120).optional().or(z.literal('')),
  interest: z.string().max(120).optional().or(z.literal('')),
  service: z.enum(['Nail services', 'Esthetic services', 'Opening information']).optional(),
});

// Validation schema for demo schedule form (optional fields)
const DemoScheduleSchema = z.object({
  name: z.string().max(120).optional().or(z.literal('')),
  organization: z.string().max(200).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').max(200).optional().or(z.literal('')),
  role: z.string().max(120).optional().or(z.literal('')),
  source: z.literal('demo-schedule'),
  timestamp: z.string().optional(),
});

async function _POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  const isNativeForm =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data');

  const redirectToContact = (status: 'submitted' | 'invalid' | 'error') =>
    NextResponse.redirect(new URL(`/contact?${status === 'submitted' ? 'submitted=1' : `error=${status}`}`, req.url), 303);

  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    // Accept JSON clients and the progressively enhanced public HTML form.
    const body = isNativeForm
      ? Object.fromEntries(await req.formData())
      : await req.json().catch(() => null);

    if (!body) {
      return isNativeForm
        ? redirectToContact('invalid')
        : NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
    }

    // Verify Turnstile token server-side if provided
    if (body.turnstileToken) {
      await hydrateProcessEnv();
      const secret = process.env.TURNSTILE_SECRET_KEY;
      if (secret) {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret, response: body.turnstileToken }),
        });
        const verifyData = await verifyRes.json() as { success: boolean };
        if (!verifyData.success) {
          return NextResponse.json({ ok: false, error: 'Bot verification failed. Please try again.' }, { status: 400 });
        }
      }
    }

    // Check if this is a demo schedule submission
    const demoScheduleParsed = DemoScheduleSchema.safeParse(body);

    if (demoScheduleParsed.success) {
      // Handle demo schedule form (all fields optional)
      const demoData = demoScheduleParsed.data;

      // Only save if email provided
      if (demoData.email) {
        const supabase = await requireAdminClient();

        if (!supabase) {
          return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
        }
        const nameParts = (demoData.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { error: dbError } = await supabase.from('marketing_contacts').insert({
          first_name: firstName,
          last_name: lastName,
          email: demoData.email,
          tags: ['demo_request', demoData.role || 'prospect', demoData.organization || ''].filter(
            Boolean,
          ),
        });

        if (dbError) {
          logger.error('Error inserting demo request:', dbError);
          // Non-blocking for demo form
        }
      }

      return NextResponse.json({ ok: true });
    }

    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      if (isNativeForm) return redirectToContact('invalid');
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid form submission',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = {
      ...parsed.data,
      // Format both native and JSON submissions here so neither loses the selection.
      message: parsed.data.interest === 'mesmerized-downtown-client' && parsed.data.service
        ? `Mesmerized by Beauty downtown client inquiry. Service interest: ${parsed.data.service}. ${parsed.data.message}`
        : parsed.data.message,
    };

    // Try to save to database (non-blocking - form should work even without DB)
    let dbSaved = false;
    try {
      const supabase = await requireAdminClient();

      // Split name into first/last for marketing_contacts table
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: dbError } = await supabase.from('marketing_contacts').insert({
        name: data.name,
        first_name: firstName,
        last_name: lastName,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        program_interest: data.program || data.interest || null,
        contact_type: data.role || 'general',
        // A service inquiry is not permission to add someone to a mailing list.
        ...(data.interest === 'mesmerized-downtown-client' ? { subscribed: false } : {}),
        tags: [
          'contact_form',
          data.role || 'general',
          data.program || data.interest || 'inquiry',
        ].filter(Boolean),
      });

      if (dbError) {
        logger.warn('Could not save contact to database (non-blocking):', dbError);
      } else {
        dbSaved = true;
      }
    } catch (dbErr) {
      logger.warn(
        'Database unavailable for contact form (non-blocking):',
        dbErr instanceof Error ? dbErr : String(dbErr),
      );
    }

    // Await the provider result: serverless execution can end after the response.
    // Never claim receipt unless a durable record or provider acceptance exists.
    const emailAccepted = await sendEmailNotification(data).then(() => true).catch((err) => {
      logger.error('Error sending email notification:', err);
      return false;
    });
    if (!dbSaved && !emailAccepted) {
      return isNativeForm
        ? redirectToContact('error')
        : NextResponse.json({ ok: false, error: 'Your inquiry could not be received. Please try again or call our team.' }, { status: 503 });
    }

    return isNativeForm
      ? redirectToContact('submitted')
      : NextResponse.json({ ok: true, dbSaved, emailAccepted });
  } catch (err) {
    logger.error('Contact API error:', err);
    if (isNativeForm) return redirectToContact('error');
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}

// Request-scoped provider acceptance check; delivery is recorded by the transport.
async function sendEmailNotification(data: z.infer<typeof ContactSchema>) {
  const { sendEmail } = await import('@/lib/email/sendgrid');
  const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

  try {
    const result = await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      replyTo: data.email,
      subject: data.interest === 'mesmerized-downtown-client'
        ? `Mesmerized by Beauty — Downtown client inquiry from ${data.name}`
        : `New Inquiry from ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escape(data.name)}</p>
        <p><strong>Email:</strong> ${escape(data.email)}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${escape(data.phone)}</p>` : ''}
        ${data.program ? `<p><strong>Program Interest:</strong> ${escape(data.program)}</p>` : ''}
        ${data.interest ? `<p><strong>Interest:</strong> ${escape(data.interest)}</p>` : ''}
        ${data.role ? `<p><strong>Role:</strong> ${escape(data.role)}</p>` : ''}
        <p><strong>Message:</strong><br>${escape(data.message)}</p>
        <hr>
        <p><em>Submitted from ${PLATFORM_DEFAULTS.canonicalDomain}</em></p>
      `,
    });
    if (!result.success) throw new Error(result.error || 'Email provider did not accept the notification');

    // SMS alert via AT&T email-to-SMS gateway (only if configured)
    if (process.env.ADMIN_SMS_GATEWAY) {
      await sendEmail({
        to: process.env.ADMIN_SMS_GATEWAY,
        subject: 'Contact',
        html: `${data.name}\n${data.email}\n${data.message.substring(0, 100)}`,
      }).catch((err) => logger.warn('[contact] SMS alert failed:', err));
    }
  } catch (error: unknown) {
    logger.error('Failed to send email notification:', error as Error);
    throw error;
  }
}
export const POST = withApiAudit('/api/contact', _POST);
