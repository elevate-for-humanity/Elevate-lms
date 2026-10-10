import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';
import { dispatchGoogleDeployment, isGoogleDeploymentConfigured } from '@/lib/gcp/dispatch-production-workflow';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const { data, error } = await db.from('ai_deployments')
    .select('*').order('started_at', { ascending: false }).limit(20);
  if (error) return safeError('Failed to fetch Dev Studio builds', 500);
  return NextResponse.json({
    builds: data,
    deploymentProvider: 'google-cloud-run',
    googleConfigured: await isGoogleDeploymentConfigured(),
  });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const confirmation = requireTypedConfirmation(body.confirmation, 'deploy_autopilot');
  if (!confirmation.ok) return NextResponse.json({
    error: 'Production deployment requires typed confirmation.',
    requiredConfirmation: confirmation.required,
  }, { status: 409 });
  const service = body.service ?? 'admin';
  if (service !== 'admin' && service !== 'marketing' && service !== 'lms') return NextResponse.json({
    error: 'Unsupported Google deployment target.',
    deploymentProvider: 'google-cloud-run',
  }, { status: 409 });
  const db = await requireAdminClient();
  const { data, error } = await db.from('ai_deployments').insert({
    service,
    environment: 'production',
    status: 'building',
    commit_sha: null,
    triggered_by: auth.id,
  }).select().single();
  if (error) return safeError('Failed to create Dev Studio build record', 500);
  try {
    const dispatch = await dispatchGoogleDeployment(service);
    await db.from('ai_deployments').update({ status: 'deploying' }).eq('id', data.id);
    return NextResponse.json({
      build: { ...data, status: 'deploying' }, triggered: true,
      verifiedLive: false, deploymentProvider: 'google-cloud-run', dispatch,
    }, { status: 202 });
  } catch (err) {
    await db.from('ai_deployments').update({ status: 'failed' }).eq('id', data.id);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Google dispatch failed',
      triggered: false,
    }, { status: 502 });
  }
}
