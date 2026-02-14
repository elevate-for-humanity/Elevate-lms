import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('id');

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    // Get certificate data
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        profiles:user_id (full_name, email),
        programs:program_id (name, credential)
      `)
      .eq('id', certificateId)
      .single();

    if (error || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Verify ownership or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = certificate.user_id === user.id;
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return certificate data for client-side PDF generation
    // Using client-side generation avoids serverless function size limits
    return NextResponse.json({
      certificate: {
        id: certificate.id,
        recipientName: certificate.profiles?.full_name || 'Student',
        programName: certificate.programs?.name || certificate.certificate_type,
        credential: certificate.programs?.credential || 'Certificate of Completion',
        issuedAt: certificate.issued_at,
        certificateNumber: certificate.certificate_number || certificate.id.slice(0, 8).toUpperCase(),
        verificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-credential?id=${certificate.id}`,
      },
      downloadUrl: certificate.pdf_url || null,
      message: certificate.pdf_url 
        ? 'Certificate ready for download' 
        : 'Use client-side PDF generation with the certificate data',
    });
  } catch (error) {
    console.error('Certificate download error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { certificateId, pdfUrl } = body;

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    // Update certificate with PDF URL (after client-side generation and upload)
    const { error } = await supabase
      .from('certificates')
      .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
      .eq('id', certificateId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Certificate PDF URL saved' });
  } catch (error) {
    console.error('Certificate update error:', error);
    return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 });
  }
}
