/**
 * GET /api/admin/header-data
 *
 * Returns the notification counts and user name shown in the admin nav bar.
 * Extracted from the layout server render so the shell loads immediately
 * and the bell badge populates asynchronously.
 *
 * Cached for 30s — stale counts in the nav badge are acceptable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { AdminNavNotif } from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const db = (await getAdminClient()) ?? (supabase as ReturnType<typeof getAdminClient> extends Promise<infer T> ? T : never);
  const effectiveDb = db ?? supabase;

  try {
    const [profileRes, appsRes, docsRes, alertsRes, wioaDocsRes, staleLeadsRes] =
      await Promise.all([
        effectiveDb
          .from('profiles')
          .select('full_name, first_name')
          .eq('id', auth.user.id)
          .maybeSingle(),
        effectiveDb
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .in('status', ['submitted', 'in_review']),
        effectiveDb
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        effectiveDb
          .from('compliance_alerts')
          .select('id', { count: 'exact', head: true })
          .not('status', 'eq', 'resolved'),
        effectiveDb
          .from('wioa_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        effectiveDb
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .lt('updated_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
          .not('status', 'in', '("closed_won","closed_lost","Closed Won","Closed Lost")'),
      ]);

    const name =
      profileRes.data?.first_name ||
      profileRes.data?.full_name?.split(' ')[0] ||
      'Admin';

    const notifs: AdminNavNotif[] = [];

    if ((appsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'apps',
        unread: true,
        href: '/admin/applications?status=submitted',
        title: `${appsRes.count} application${appsRes.count !== 1 ? 's' : ''} pending review`,
        time: 'Pending action',
      });
    }
    if ((docsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'docs',
        unread: true,
        href: '/admin/documents/review',
        title: `${docsRes.count} document${docsRes.count !== 1 ? 's' : ''} need review`,
        time: 'Compliance required',
      });
    }
    if ((alertsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'compliance',
        unread: true,
        href: '/admin/compliance',
        title: `${alertsRes.count} unresolved compliance alert${alertsRes.count !== 1 ? 's' : ''}`,
        time: 'Needs attention',
      });
    }
    if ((wioaDocsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'wioa',
        unread: true,
        href: '/admin/wioa/documents',
        title: `${wioaDocsRes.count} WIOA document${wioaDocsRes.count !== 1 ? 's' : ''} awaiting review`,
        time: 'WIOA queue',
      });
    }
    if ((staleLeadsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'leads',
        unread: true,
        href: '/admin/crm/leads',
        title: `${staleLeadsRes.count} CRM lead${staleLeadsRes.count !== 1 ? 's' : ''} with no activity in 5+ days`,
        time: 'Follow-up needed',
      });
    }

    return NextResponse.json(
      { userName: name, notifs },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
    );
  } catch (err) {
    logger.warn('[header-data] fetch failed', err instanceof Error ? err.message : err);
    return NextResponse.json({ userName: 'Admin', notifs: [] });
  }
}
