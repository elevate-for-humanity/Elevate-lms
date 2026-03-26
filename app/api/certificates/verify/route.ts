import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { verifyCertificate, getVerificationUrl, getQRCodeUrl } from '@/lib/certificates/verification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const searchParams = request.nextUrl.searchParams;
    const certificateNumber = searchParams.get('number');

    if (!certificateNumber) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('serial', certificateNumber)
      .maybeSingle();

    if (error || !cert) {
      return NextResponse.json(
        { valid: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        serial: cert.serial,
        studentName: cert.student_name,
        courseName: cert.course_name,
        completionDate: cert.completion_date,
        issuedAt: cert.issued_at,
        expiresAt: cert.expires_at,
      }
    });
  } catch (error) {
    logger.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/certificates/verify', _GET);
