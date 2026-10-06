// pre-auth-registry: exempt - Dev Studio auth is required before ai_deployments/dev_audit_logs writes; triggered_by/user_id come from the authenticated operator.
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getGoogleServices, getGoogleService } from '@/lib/google/runtime';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('ai_deployments')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) return safeError('Failed to fetch Dev Studio builds', 500);
  const health=await Promise.all(getGoogleServices().map(async s=>{try{return (await getGoogleService(s)).healthy}catch{return false}}));
  return NextResponse.json({builds:data,googleConfigured:health.every(Boolean)});
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;


  const body = await req.json().catch(() => ({}));
  const confirmation = requireTypedConfirmation(body.confirmation, 'deploy_autopilot');
  if (!confirmation.ok) {
    return NextResponse.json({ error: 'Production deployment requires typed confirmation.', requiredConfirmation: confirmation.required }, { status: 409 });
  }
  const db = await requireAdminClient();
  const service = body.service ?? 'admin';

  const services=service==='all'?getGoogleServices():getGoogleServices().filter(item=>item.key===service||item.id===service);
  if(!services.length){await db.from('ai_deployments').update({status:'failed'}).eq('id',data.id);return safeError(`Unknown Google service: ${service}`,400);}
  const checks=await Promise.all(services.map(async item=>({service:item.id,health:await getGoogleService(item)})));
  const healthy=checks.every(x=>x.health.healthy);
  await db.from('ai_deployments').update({status:healthy?'deployed':'failed'}).eq('id',data.id);
  return NextResponse.json({build:{...data,status:healthy?'deployed':'failed'},provider:'google-cloud',services:checks},{status:healthy?201:503});
catch (err) {
    await db.from('ai_deployments').update({ status: 'failed' }).eq('id', data.id);
    return safeInternalError(err, 'Northflank build trigger failed');
  }
}
