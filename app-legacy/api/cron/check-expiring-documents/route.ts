/**
 * GET /api/cron/check-expiring-documents
 * 7-day and 3-day expiry warnings for all compliance documents.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const now = new Date();

  const windows = [
    { days: 7, label: '7 days' },
    { days: 3, label: '3 days' },
  ];

  let total_warned = 0;

  for (const window of windows) {
    const windowStart = new Date(now.getTime() + (window.days - 1) * 86400000).toISOString();
    const windowEnd = new Date(now.getTime() + window.days * 86400000).toISOString();

    const { data: docs } = await db
      .from('documents')
      .select('id, user_id, document_type, expires_at, profiles!documents_user_id_fkey(full_name, email)')
      .eq('status', 'active')
      .gte('expires_at', windowStart)
      .lt('expires_at', windowEnd);

    for (const doc of docs ?? []) {
      const profile = (doc as any).profiles;
      if (!profile?.email) continue;

      await sendEmail({
        to: profile.email,
        subject: `⚠️ ${doc.document_type ?? 'Document'} expires in ${window.label}`,
        html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Your <strong>${doc.document_type ?? 'compliance document'}</strong> expires in <strong>${window.label}</strong>. Please renew immediately to avoid a compliance hold.</p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/check-expiring-documents] Email failed', { doc_id: doc.id, error: String(e) }));

      total_warned++;
    }
  }

  logger.info('[cron/check-expiring-documents] Done', { total_warned });
  return NextResponse.json({ ok: true, total_warned });
});
