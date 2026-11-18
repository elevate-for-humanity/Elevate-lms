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

  const canReviewLearnerUploads = hasAnyRole(auth.effectiveRoles, ['admin']);
  const canReviewHolderUploads = hasAnyRole(auth.effectiveRoles, ['admin', 'staff']);
  const noUploads = { data: [], count: 0, error: null };
  const alertTarget = 11;
  const pageSize = 50;

  const loadLearnerDocumentAlerts = async () => {
    const alerts: AdminNavNotif[] = [];
    for (let offset = 0; alerts.length < alertTarget; offset += pageSize) {
      const { data, error } = await effectiveDb
        .from('documents')
        .select('id,user_id,file_name,file_path,storage_path,file_url,metadata,created_at')
        .in('status', pendingDocumentStatuses)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) return { data: alerts, count: alerts.length, error };

      const rows = data ?? [];
      const userIds = [...new Set(rows.map((doc) => doc.user_id).filter(Boolean))];
      const profiles = userIds.length
        ? await effectiveDb.from('profiles').select('id,full_name,email').in('id', userIds)
        : { data: [], error: null };
      if (profiles.error) return { data: alerts, count: alerts.length, error: profiles.error };
      const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));

      for (const doc of rows) {
        const hydrated = { ...doc, profiles: profileById.get(doc.user_id) ?? null };
        if (isQaDocumentRecord(hydrated) || !resolveDocumentStorageLocator(hydrated)) continue;
        alerts.push({
          id: `document-upload:${doc.id}`,
          unread: true,
          href: `/documents/review/${doc.id}`,
          title: 'New document awaiting review',
          time: doc.created_at ?? '',
        });
        if (alerts.length >= alertTarget) break;
      }
      if (rows.length < pageSize) break;
    }
    return { data: alerts, count: alerts.length, error: null };
  };

  const loadProgramHolderDocumentAlerts = async () => {
    const alerts: AdminNavNotif[] = [];
    for (let offset = 0; alerts.length < alertTarget; offset += pageSize) {
      const { data, error } = await effectiveDb
        .from('program_holder_documents')
        .select('id,user_id,file_name,file_url,created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) return { data: alerts, count: alerts.length, error };

      const rows = data ?? [];
      const userIds = [...new Set(rows.map((doc) => doc.user_id).filter(Boolean))];
      const profiles = userIds.length
        ? await effectiveDb.from('profiles').select('id,full_name,email').in('id', userIds)
        : { data: [], error: null };
      if (profiles.error) return { data: alerts, count: alerts.length, error: profiles.error };
      const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));

      for (const doc of rows) {
        const hydrated = { ...doc, profiles: profileById.get(doc.user_id) ?? null };
        if (isQaDocumentRecord(hydrated) || !doc.file_url?.trim()) continue;
        alerts.push({
          id: `holder-document-upload:${doc.id}`,
          unread: true,
          href: '/program-holder-documents',
          title: 'New program holder document awaiting review',
          time: doc.created_at ?? '',
        });
        if (alerts.length >= alertTarget) break;
      }
      if (rows.length < pageSize) break;
    }
    return { data: alerts, count: alerts.length, error: null };
  };

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
      canReviewLearnerUploads ? loadLearnerDocumentAlerts() : Promise.resolve(noUploads),
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
      canReviewHolderUploads ? loadProgramHolderDocumentAlerts() : Promise.resolve(noUploads),
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
    const learnerDocumentAlerts = docsRes.data ?? [];
    const holderDocumentAlerts = holderUploads.data ?? [];
    const documentAlerts = [...learnerDocumentAlerts, ...holderDocumentAlerts]
      .sort((a, b) => String(b.time).localeCompare(String(a.time)))
      .slice(0, 10);
    const displayedLearnerAlerts = documentAlerts.filter((alert) =>
      alert.id.startsWith('document-upload:'),
    ).length;
    const displayedHolderAlerts = documentAlerts.filter((alert) =>
      alert.id.startsWith('holder-document-upload:'),
    ).length;
    notifs.unshift(
      ...documentAlerts.map((alert) => ({
        ...alert,
        time: alert.time
          ? new Date(alert.time).toLocaleDateString('en-US', { timeZone: 'America/Indianapolis' })
          : 'Pending action',
      })),
    );
    if (learnerDocumentAlerts.length > displayedLearnerAlerts) {
      notifs.push({
        id: 'document-upload:queue',
        unread: true,
        href: '/documents/review?status=pending',
        title: 'More learner uploads awaiting review',
        time: 'Open learner document review',
      });
    }
    if (holderDocumentAlerts.length > displayedHolderAlerts) {
      notifs.push({
        id: 'holder-document-upload:queue',
        unread: true,
        href: '/program-holder-documents',
        title: 'More program holder uploads awaiting review',
        time: 'Open program holder document review',
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
