import { createAdminClient } from '@/lib/supabase/admin';

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);
    const { certificateId } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Fetch certificate details
    const { data: certificate } = await supabase
      .from('certificates')
      .select(
        `
        id,
        certificate_number,
        verification_code,
        student_name,
        course_title,
        profiles!certificates_student_id_fkey!inner (
          email
        )
      `
      )
      .eq('id', certificateId)
      .single();

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Type guard: Extract profile from array
    const profile = Array.isArray(certificate.profiles)
      ? certificate.profiles[0]
      : certificate.profiles;

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/cert/verify/${certificate.verification_code}`;

    const html = emailTemplates.certificateIssued(
      certificate.student_name,
      certificate.course_title,
      certificate.certificate_number,
      verificationUrl
    );

    await sendEmail({
      to: profile?.email || '',
      subject: `Your Certificate is Ready - ${certificate.course_title}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error('Error sending certificate email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/emails/certificate', _POST);
