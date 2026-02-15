import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const certificateNumber = searchParams.get('number');

    if (!certificateNumber) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

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
