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
import {
  isQaDocumentRecord,
  pendingDocumentStatuses,
  resolveDocumentStorageLocator,
} from '@/lib/admin/document-record';
import { hasAnyRole } from '@/lib/rbac/role-matrix';
import { logger } from '@/lib/logger';
import type { AdminNavNotif } from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const db =
    (await getAdminClient()) ??
    (supabase as ReturnType<typeof getAdminClient> extends Promise<infer T> ? T : never);
  const effectiveDb = db ?? supabase;

  const canReviewUploads = hasAnyRole(auth.effectiveRoles, ['admin']);
  const noUploads = { data: [], count: 0, error: null };

  try {
    const [
      profileRes,
      appsRes,
      docsRes,
      alertsRes,
      wioaDocsRes,
      staleLeadsRes,
      billingRes,
      holderUploads,
    ] = await Promise.all([
      effectiveDb
        .from('profiles')
        .select('full_name, first_name')
        .eq('id', auth.user.id)
        .maybeSingle(),
      effectiveDb
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'in_review']),
      canReviewUploads
        ? effectiveDb
            .from('documents')
            .select('id,file_name,file_path,storage_path,file_url,metadata,created_at')
            .in('status', pendingDocumentStatuses)
            .order('created_at', { ascending: false })
            .limit(30)
        : Promise.resolve(noUploads),
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
      effectiveDb
        .from('notifications')
        .select('id,title,created_at', { count: 'exact' })
        .eq('user_id', auth.user.id)
        .eq('read', false)
        .eq('metadata->>source', 'service-billing')
        .order('created_at', { ascending: false })
        .limit(20),
      canReviewUploads
        ? effectiveDb
            .from('program_holder_documents')
            .select('id,file_name,file_url,created_at')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(20)
        : Promise.resolve(noUploads),
    ]);

    const unavailableSources = (
      [
        ['applications', appsRes],
        ['documents', docsRes],
        ['program-holder uploads', holderUploads],
        ['compliance', alertsRes],
        ['wioa', wioaDocsRes],
        ['leads', staleLeadsRes],
        ['service-billing', billingRes],
      ] as const
    )
      .filter(([, result]) => Boolean(result.error))
      .map(([name]) => name);
    const name =
      profileRes.data?.first_name || profileRes.data?.full_name?.split(' ')[0] || 'Admin';

    const notifs: AdminNavNotif[] = (billingRes.data || []).map((row) => ({
      id: `service-billing:${row.id}`,
      unread: true,
      href: '/operations/infrastructure-costs#service-billing',
      title: row.title,
      time: 'Service billing · needs attention',
    }));
    if ((billingRes.count || 0) > 20)
      notifs.push({
        id: 'service-billing:remaining',
        unread: true,
        href: '/operations/infrastructure-costs#service-billing',
        title: `${billingRes.count - 20} more billing warnings`,
        time: 'Review service billing',
      });

    if ((appsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'apps',
        unread: true,
        href: '/applications?status=submitted',
        title: `${appsRes.count} application${appsRes.count !== 1 ? 's' : ''} pending review`,
        time: 'Pending action',
      });
    }
    const documentAlerts = [
      ...(docsRes.data ?? [])
        .filter((doc) => !isQaDocumentRecord(doc) && resolveDocumentStorageLocator(doc))
        .map((doc) => ({
          id: `document-upload:${doc.id}`,
          unread: true,
          href: `/documents/review/${doc.id}`,
          title: 'New document awaiting review',
          time: doc.created_at,
        })),
      ...(holderUploads.data ?? [])
        .filter((doc) => !isQaDocumentRecord(doc) && doc.file_url?.trim())
        .map((doc) => ({
          id: `holder-document-upload:${doc.id}`,
          unread: true,
          href: '/program-holder-documents',
          title: 'New program holder document awaiting review',
          time: doc.created_at,
        })),
    ].sort((a, b) => String(b.time).localeCompare(String(a.time)));
    notifs.unshift(
      ...documentAlerts.slice(0, 10).map((alert) => ({
        ...alert,
        time: alert.time
          ? new Date(alert.time).toLocaleDateString('en-US', { timeZone: 'America/Indianapolis' })
          : 'Pending action',
      })),
    );
    if (documentAlerts.length > 10) {
      notifs.push({
        id: 'document-upload:queue',
        unread: true,
        href: '/documents/review?status=pending',
        title: 'More uploads awaiting review',
        time: 'Open document review',
      });
    }
    if ((alertsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'compliance',
        unread: true,
        href: '/compliance',
        title: `${alertsRes.count} unresolved compliance alert${alertsRes.count !== 1 ? 's' : ''}`,
        time: 'Needs attention',
      });
    }
    if ((wioaDocsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'wioa',
        unread: true,
        href: '/wioa/documents',
        title: `${wioaDocsRes.count} WIOA document${wioaDocsRes.count !== 1 ? 's' : ''} awaiting review`,
        time: 'WIOA queue',
      });
    }
    if ((staleLeadsRes.count ?? 0) > 0) {
      notifs.push({
        id: 'leads',
        unread: true,
        href: '/crm/leads',
        title: `${staleLeadsRes.count} CRM lead${staleLeadsRes.count !== 1 ? 's' : ''} with no activity in 5+ days`,
        time: 'Follow-up needed',
      });
    }

    return NextResponse.json(
      {
        userName: name,
        notifs,
        status: unavailableSources.length ? 'degraded' : 'ok',
        unavailableSources,
      },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
    );
  } catch (err) {
    logger.warn('[header-data] fetch failed', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'HEADER_DATA_UNAVAILABLE', status: 'unavailable', userName: 'Admin', notifs: [] },
      { status: 503 },
    );
  }
}
