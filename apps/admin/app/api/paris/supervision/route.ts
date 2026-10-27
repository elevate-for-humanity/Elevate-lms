import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PARIS_IDENTITY } from '@/lib/ai/paris-identity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Real durable observations, never synthetic registry heartbeats. */
export async function GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const buildId=req.nextUrl.searchParams.get('buildId');
  if(buildId && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(buildId))return NextResponse.json({error:'Invalid build ID.'},{status:400});
  const db = await requireAdminClient();
  let courseQuery=db.from('ultimate_build_jobs').select('id,build_id,status,heartbeat_at,lease_owner,lease_expires_at,attempts,max_attempts,monitor').order('updated_at',{ascending:false}).limit(50);
  courseQuery=buildId?courseQuery.eq('build_id',buildId):courseQuery.eq('monitor->>enabled','true');
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [events, jobs, repairPolicy] = await Promise.all([
    db.from('paris_runtime_events').select('id,kind,operation,status,provider,duration_ms,failure_category,recovery,next_action,correlation_id,created_at')
      .gte('created_at', since).order('created_at', {ascending:false}).limit(100),
    courseQuery,
    db.from('paris_autopilot_policy').select('enabled,max_daily_repairs,authorized_at').eq('id',true).maybeSingle(),
  ]);
  let repairQuery=db.from('paris_code_repairs').select('id,status,source_job_id,workflow_run_id,release_sha,error_code,verification,created_at,updated_at').order('created_at',{ascending:false}).limit(20);
  if(buildId)repairQuery=repairQuery.in('source_job_id',(jobs.data??[]).map(job=>job.id));
  const repairs=await repairQuery;
  if (events.error || jobs.error) return NextResponse.json({identity:PARIS_IDENTITY,status:'unavailable',
    error:'PARIS could not read its durable supervision records.'}, {status:503});
  return NextResponse.json({identity:PARIS_IDENTITY,observedAt:new Date().toISOString(),
    status:events.data.length ? 'observed' : 'no_observations',
    coverage:{inference:'shared aiChat gateway',commands:'shared governed command executor',
      workflows:'API handlers using withApiAudit',courses:'canonical course queue monitor'},
    events:events.data,courses:jobs.data,
    codeRepair:{available:!repairs.error&&!repairPolicy.error,policy:repairPolicy.data,repairs:repairs.data??[]},
    limits:['Recent failures are historical observations, not proof a service is still failing.',
      'Uninstrumented endpoints and external services are not covered.',
      'Code repair uses independent tests, bounded dispatch and exact deployment verification; protected failures remain blocked.']},
    {headers:{'cache-control':'no-store'}});
}
