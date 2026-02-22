export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimitNew as rateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Validation schema for contact form
const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(200),
  phone: z.string().max(50).optional().or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters').max(4000),
  program: z.string().max(120).optional().or(z.literal('')),
  role: z.string().max(120).optional().or(z.literal('')),
  interest: z.string().max(120).optional().or(z.literal('')),
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

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Rate limiting: 5 requests per minute per IP
    const identifier = getClientIdentifier(req.headers);
    const rateLimitResult = await rateLimit(identifier, RATE_LIMITS.CONTACT_FORM);

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Too many requests. Please try again in a minute.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          }
        }
      );
    }

    // Parse and validate request body
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Check if this is a demo schedule submission
    const demoScheduleParsed = DemoScheduleSchema.safeParse(body);
    
    if (demoScheduleParsed.success) {
      // Handle demo schedule form (all fields optional)
      const demoData = demoScheduleParsed.data;
      
      // Only save if email provided
      if (demoData.email) {
        const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
        const nameParts = (demoData.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const { error: dbError } = await db
          .from('marketing_contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: demoData.email,
            tags: ['demo_request', demoData.role || 'prospect', demoData.organization || ''].filter(Boolean),
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
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid form submission',
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Try to save to database (non-blocking - form should work even without DB)
    let dbSaved = false;
    try {
      const supabase = createAdminClient();
      
      // Split name into first/last for marketing_contacts table
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { error: dbError } = await db
        .from('marketing_contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: data.email,
          tags: ['contact_form', data.role || 'general', data.program || data.interest || 'inquiry'].filter(Boolean),
        });

      if (dbError) {
        logger.warn('Could not save contact to database (non-blocking):', dbError);
      } else {
        dbSaved = true;
      }
    } catch (dbErr) {
      logger.warn('Database unavailable for contact form (non-blocking):', dbErr);
    }

    // Send email notification (non-blocking but important fallback when DB unavailable)
    sendEmailNotification(data).catch((err) => {
      logger.error('Error sending email notification:', err);
    });

    // Return success - form submission is valid even if DB save failed
    // Email notification serves as backup
    return NextResponse.json({ ok: true, dbSaved });
  } catch (err) {
    logger.error('Contact API error:', err);
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// Send email notification (async, non-blocking)
async function sendEmailNotification(data: z.infer<typeof ContactSchema>) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY not configured, skipping email notification');
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: 'Elevate for Humanity <noreply@elevateforhumanity.org>',
      to: 'info@elevateforhumanity.org',
      subject: `New Inquiry from ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
        ${data.program ? `<p><strong>Program Interest:</strong> ${data.program}</p>` : ''}
        ${data.role ? `<p><strong>Role:</strong> ${data.role}</p>` : ''}
        <p><strong>Message:</strong><br>${data.message}</p>
        <hr>
        <p><em>Submitted from www.elevateforhumanity.org</em></p>
      `,
    });

    // SMS alert via AT&T gateway
    await resend.emails.send({
      from: 'Elevate <noreply@elevateforhumanity.org>',
      to: process.env.ADMIN_SMS_GATEWAY || '',
      subject: 'Contact',
      text: `${data.name}\n${data.email}\n${data.message.substring(0, 100)}`,
    });
  } catch (error: unknown) {
    logger.error('Failed to send email notification:', error as Error);
    throw error;
  }
}
