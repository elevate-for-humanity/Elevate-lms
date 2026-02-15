import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { generateShortId } from '@/lib/utils/id-generator';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { courseId, userId, enrollmentId, completionData } = await req.json();

    const supabase = await createClient();

    // Update enrollment status
    const { error: updateError } = await supabase
      .from('partner_enrollments')
      .update({
        status: 'completed',
        completion_date: new Date().toISOString(),
        completion_data: completionData,
      })
      .eq('id', enrollmentId);

    if (updateError) throw updateError;

    // Create certificate record
    const certificateNumber = `EFH-${generateShortId()}-${courseId.substring(0, 8)}`;

    const { error: certError } = await supabase
      .from('module_certificates')
      .insert({
        user_id: userId,
        module_id: courseId,
        certificate_number: certificateNumber,
        certificate_name: completionData.courseName || 'Course Completion',
        issued_by: 'Elevate For Humanity',
        issued_date: new Date().toISOString().split('T')[0],
        is_partner_cert: true,
      });

    if (certError) throw certError;

    // Send completion email
    await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/course-completion`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          courseId,
          certificateNumber,
        }),
      }
    );

    return NextResponse.json({
      success: true,
      certificateNumber,
    });
  } catch (error) { 
    logger.error(
      'Course completion error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to record completion' },
      { status: 500 }
    );
  }
}
