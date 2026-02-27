import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const { data: expiringDocs } = await db
      .from('documents')
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
      .eq('status', 'approved')
      .not('expiration_date', 'is', null)
      .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('expiration_date', today.toISOString().split('T')[0]);

    const notifications = [];

    for (const doc of expiringDocs || []) {
      const expirationDate = new Date(doc.expiration_date);
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if ([30, 15, 7, 1].includes(daysUntilExpiration)) {
        const userProfile = doc.profiles as any;
        if (userProfile?.email) {
          await sendEmail({
            to: userProfile.email,
            subject: `Document Expiring Soon - ${doc.file_name}`,
            html: `
              <h2>Document Expiration Notice</h2>
              <p>Your document <strong>${doc.file_name}</strong> will expire in <strong>${daysUntilExpiration} day(s)</strong>.</p>
              <p><strong>Expiration Date:</strong> ${expirationDate.toLocaleDateString()}</p>
              <p>Please upload a new version to maintain compliance.</p>
              <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/lms/documents/upload">Upload New Document</a></p>
            `,
          });
          notifications.push({ documentId: doc.id, daysUntilExpiration });
        }
      }

      if (daysUntilExpiration <= 0) {
        await db
          .from('documents')
          .update({ status: 'expired' })
          .eq('id', doc.id);
      }
    }

    return NextResponse.json({
      success: true,
      checked: expiringDocs?.length || 0,
      notificationsSent: notifications.length,
      notifications,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/cron/check-expiring-documents', _GET);
