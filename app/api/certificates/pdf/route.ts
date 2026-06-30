import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Use Node.js runtime
export const runtime = 'nodejs';

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const serial = searchParams.get('serial');

  if (!serial) return new Response('Missing serial', { status: 400 });

  // Fetch certificate data
  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('serial', serial)
    .maybeSingle();

  if (!cert) return new Response('Certificate not found', { status: 404 });

  // Fetch user and course details
  const db = await requireAdminClient();
  const { data: userAuth } = await db.auth.admin.getUserById(cert.user_id);
  const u = userAuth?.user;

  const { data: c } = await supabase
    .from('lms_courses')
    .select('title')
    .eq('id', cert.course_id)
    .maybeSingle();

  // Generate verification URL
  const origin = req.headers.get('origin') || PLATFORM_DEFAULTS.siteUrl;
  const verifyUrl = `${origin}/verify/${cert.verification_code || cert.serial}`;

  // Generate PDF via internal API route (runs on same runtime container)
  const pdfResponse = await fetch(`${origin}/api/internal/cert-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.CRON_SECRET ?? '',
    },
    body: JSON.stringify({
      studentName: cert.student_name || u?.email || 'Learner',
      courseName: cert.course_name || c?.title || 'Course',
      completionDate: new Date(cert.completion_date).toLocaleDateString(),
      certificateNumber: cert.serial,
      verifyUrl,
    }),
  });

  if (!pdfResponse.ok) {
    const detail = await pdfResponse.text();
    logger.error('cert-pdf generation error', { serial, status: pdfResponse.status, detail });
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
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
export const GET = withApiAudit('/api/cert/pdf', _GET);
