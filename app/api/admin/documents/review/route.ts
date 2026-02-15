import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      (profile.role !== 'admin' && profile.role !== 'super_admin')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, action, rejectionReason, adminId } =
      await request.json();

    if (!documentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const { data: document, error: updateError } = await supabase
      .from('documents')
      .update({
        status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? rejectionReason : null,
      })
      .eq('id', documentId)
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    const userProfile = document.profiles as any;
    if (userProfile?.email) {
      await sendEmail({
        to: userProfile.email,
        subject: `Document ${status === 'approved' ? 'Approved' : 'Rejected'} - ${document.file_name}`,
        html: `
          <h2>Document Review Update</h2>
          <p>Your document <strong>${document.file_name}</strong> has been ${status}.</p>
          ${status === 'rejected' ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>Login to view details: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/student/documents">View Documents</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
