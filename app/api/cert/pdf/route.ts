import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { getUserById } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

// Use Node.js runtime
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const serial = searchParams.get('serial');

  if (!serial) return new Response('Missing serial', { status: 400 });

  // Fetch certificate data
  const { data: cert } = await db
    .from('certificates')
    .select('*')
    .eq('serial', serial)
    .maybeSingle();

  if (!cert) return new Response('Certificate not found', { status: 404 });

  // Fetch user and course details
  let u;
  try {
    u = await getUserById(cert.user_id);
  } catch (error) {
      logger.error("Unhandled error", error instanceof Error ? error : undefined);
    }

  const { data: c } = await db
    .from('training_courses')
    .select('title')
    .eq('id', cert.course_id)
    .maybeSingle();

  // Generate verification URL
  const origin = req.headers.get('origin') || 'https://www.elevateforhumanity.org';
  const verifyUrl = `${origin}/cert/verify/${cert.verification_code || cert.serial}`;

  // Call Netlify function for PDF generation
  // This keeps heavy PDF libraries out of the main Next.js server handler
  const pdfResponse = await fetch(`${process.env.URL || origin}/.netlify/functions/cert-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: cert.student_name || u?.email || 'Learner',
      courseName: cert.course_name || c?.title || 'Course',
      completionDate: new Date(cert.completion_date).toLocaleDateString(),
      certificateNumber: cert.serial,
      verifyUrl,
    }),
  });

  if (!pdfResponse.ok) {
    const error = await pdfResponse.text();
    return NextResponse.json({ error: 'PDF generation failed', details: error }, { status: 500 });
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${serial}.pdf"`,
    },
  });
}
