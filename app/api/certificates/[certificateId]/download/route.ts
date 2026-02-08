import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { generateCertificatePDF } from '@/lib/certificates/generator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const supabase = await createClient();
    const { certificateId } = await params;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: certificate } = await supabase
      .from('certificates')
      .select('*, profiles(full_name), courses(title, program_hours)')
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
      studentName: certificate.profiles.full_name,
      courseName: certificate.courses.title,
      completionDate: new Date(certificate.issued_at).toLocaleDateString(),
      certificateNumber: certificate.certificate_number,
      programHours: certificate.courses.program_hours,
    });

    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_number}.pdf"`,
      },
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
