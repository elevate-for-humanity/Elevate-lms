import { createClient } from '@/lib/supabase/server';

import { NextResponse } from 'next/server';
import { generateCertificatePDF } from '@/lib/certificates/generator';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { certificateId } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // profiles join works via user_id FK; courses join does not exist on this table
    const { data: certificate } = await supabase
      .from('certificates')
      .select('*, profiles(full_name)')
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .single();

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    const pdfBlob = await generateCertificatePDF({
      studentName: certificate.profiles?.full_name || certificate.metadata?.student_name || 'Student',
      courseName: certificate.course_title || certificate.program_name || certificate.metadata?.course_name || 'Course',
      completionDate: new Date(certificate.issued_at).toLocaleDateString(),
      certificateNumber: certificate.certificate_number,
      programHours: certificate.hours_completed,
    });

    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_number}.pdf"`,
      },
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/certificates/[certificateId]/download', _GET);
