import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { toErrorMessage } from '@/lib/safe';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  attachStoredLicensedMedia,
  recommendLicensedMediaForCourse,
} from '@/lib/course-builder/licensed-media';
import { upsertEnvatoWorkspaceManifest, type EnvatoWorkspaceManifestItem } from '@/lib/course-builder/envato-workspace';
import { resumeMediaDependency } from '@/lib/ultimate-course-builder/worker/resume-media-dependency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Unlimited subscription media is acquired through the existing authenticated
// Studio browser and stored licensed library. Market tokens prove neither
// subscription access nor a license for a subscription item.
const SUBSCRIPTION_BROWSER_URL = '/studio/browser?provider=envato&signin=1';
function marketDisabledResponse() {
  return NextResponse.json({
    connected: false,
    provider: 'Envato subscription',
    accessModel: 'subscription-licensed-library',
    marketEnabled: false,
    error: 'ENVATO_MARKET_DISABLED_USE_SUBSCRIPTION_WORKSPACE',
    browserUrl: SUBSCRIPTION_BROWSER_URL,
  }, { status: 410 });
}

async function courseOrg(db: Awaited<ReturnType<typeof requireAdminClient>>, courseId: string) {
  const { data, error } = await db
    .from('courses')
    .select('id,org_id')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw Object.assign(new Error('Course not found'), { status: 404 });
  return data.org_id as string | null;
}

function errorResponse(error: unknown) {
  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: unknown }).status) || 502
      : 502;
  return NextResponse.json({ connected: false, error: toErrorMessage(error) }, { status });
}

const _GET = withAuth(
  async (request: NextRequest) => {
    const limited = await applyRateLimit(request, 'api');
    if (limited) return limited;
    try {
      const action = request.nextUrl.searchParams.get('action') || 'status';
      const courseId = request.nextUrl.searchParams.get('courseId')?.trim() || '';
      if (action === 'status') {
        return NextResponse.json({
          connected: false,
          provider: 'Envato subscription',
          accessModel: 'subscription-licensed-library',
          marketEnabled: false,
          subscriptionVerified: false,
          connectionStatus: 'browser_session_verification_required',
          browserUrl: SUBSCRIPTION_BROWSER_URL,
        });
      }
      if (action === 'purchases' || action === 'download') return marketDisabledResponse();
      if (action === 'recommendations') {
        if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        const db = await requireAdminClient();
        await courseOrg(db, courseId);
        const recommendations = await recommendLicensedMediaForCourse({ db, courseId });
        return NextResponse.json({ connected: true, recommendations });
      }
      if (action === 'library') {
        const db = await requireAdminClient();
        const { data, error } = await db
          .from('licensed_media_entitlements')
          .select(
            'id,title,provider_item_id,item_url,thumbnail_url,license_type,metadata,updated_at',
          )
          .eq('provider', 'envato')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        const assets = (data ?? []).filter((row) => {
          const metadata =
            row.metadata && typeof row.metadata === 'object'
              ? (row.metadata as Record<string, unknown>)
              : {};
          return (
            metadata.storage_bucket === 'course_videos' &&
            typeof metadata.storage_path === 'string' &&
            metadata.storage_path.startsWith('licensed-library/')
          );
        });
        return NextResponse.json({ connected: true, assets });
      }
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    } catch (error) {
      return errorResponse(error);
    }
  },
  { roles: ['admin'] },
);

const _POST = withAuth(
  async (request: NextRequest, user) => {
    const limited = await applyRateLimit(request, 'strict');
    if (limited) return limited;
    try {
      const input = (await request.json()) as {
        action?: string;
        courseId?: string;
        matchId?: string;
        lessonId?: string;
        runId?: string;
        workspaceName?: string;
        envatoWorkspaceUrl?: string;
        items?: EnvatoWorkspaceManifestItem[];
      };
      const db = await requireAdminClient();
      if (input.action === 'workspace-manifest') {
        if (!input.runId || !input.courseId || !input.workspaceName)
          return NextResponse.json({ error: 'runId, courseId, and workspaceName are required' }, { status: 400 });
        await courseOrg(db, input.courseId);
        const manifest = await upsertEnvatoWorkspaceManifest({
          db,
          runId: input.runId,
          courseId: input.courseId,
          workspaceName: input.workspaceName,
          envatoWorkspaceUrl: input.envatoWorkspaceUrl,
          items: Array.isArray(input.items) ? input.items : [],
        });
        return NextResponse.json({ ok: true, manifest });
      }
      if (input.action === 'sync') return marketDisabledResponse();
      if (input.action === 'recommend') {
        if (!input.courseId)
          return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
        await courseOrg(db, input.courseId);
        const recommendations = await recommendLicensedMediaForCourse({
          db,
          courseId: input.courseId,
        });
        return NextResponse.json({ ok: true, recommendations });
      }
      if (input.action === 'approve' || input.action === 'reject') {
        if (!input.matchId)
          return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
        const update =
          input.action === 'approve'
            ? {
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                failure_reason: null,
              }
            : { status: 'rejected', approved_by: null, approved_at: null };
        const { data, error } = await db
          .from('course_lesson_media_matches')
          .update(update)
          .eq('id', input.matchId)
          .in('status', ['suggested', 'approved', 'rejected'])
          .select('id,status,lesson_id')
          .single();
        if (error) throw error;
        return NextResponse.json({ ok: true, match: data });
      }
      if (input.action === 'attach') {
        if (!input.matchId || !input.courseId || !input.lessonId) {
          return NextResponse.json(
            { error: 'matchId, courseId, and lessonId are required' },
            { status: 400 },
          );
        }
        await courseOrg(db, input.courseId);
        const video = await attachStoredLicensedMedia({
          db,
          matchId: input.matchId,
          courseId: input.courseId,
          lessonId: input.lessonId,
          actorId: user.id,
        });
        const resumed = await resumeMediaDependency(db,input.courseId,[input.lessonId]);
        // Importing source footage must never start the archived media queue or
        // label an unqueued learner video as queued. Only the Ultimate builder
        // owns rendering, scene verification and publication.
        return NextResponse.json({
          ok: true,
          video,
          ultimateJobs: resumed,
          buildResumeStatus: resumed.length ? 'queued' : 'not_queued',
        });
      }
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    } catch (error) {
      return errorResponse(error);
    }
  },
  { roles: ['admin'] },
);

export const GET = withApiAudit('/api/admin/integrations/envato', _GET);
export const POST = withApiAudit('/api/admin/integrations/envato', _POST);
