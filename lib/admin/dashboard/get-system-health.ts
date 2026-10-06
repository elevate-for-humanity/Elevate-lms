import type { SupabaseClient } from '@/lib/supabase';
import { hydrateProcessEnv } from '@/lib/secrets';

export interface SystemHealthAlert { code: string; severity: 'info' | 'warning' | 'critical'; message: string; }
export interface DashboardSystemHealth {
  quickBooksWebhookOk: boolean;
  quickBooksBillingOk: boolean;
  buildEnvOk: boolean;
  staleJobs: number;
  degraded: boolean;
  missingDocuments: number;
  missingCertifications: number;
  unresolvedFlags: number;
  alerts: SystemHealthAlert[];
}

const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY'];

export async function getSystemHealth(db: SupabaseClient): Promise<DashboardSystemHealth> {
  await hydrateProcessEnv();
  const alerts: SystemHealthAlert[] = [];
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  const buildEnvOk = missingEnv.length === 0;
  if (!buildEnvOk) alerts.push({ code: 'missing_env_vars', severity: 'critical', message: `Missing env vars: ${missingEnv.join(', ')}` });

  const [billingConfig, staleJobs, missingDocs, missingCertifications, unresolvedFlags] = await Promise.all([
    db.from('billing_provider_config').select('provider,enabled,mode').eq('provider','quickbooks').maybeSingle(),
    db.from('job_queue').select('id',{count:'exact',head:true}).eq('status','processing').lt('updated_at',new Date(Date.now()-30*60*1000).toISOString()),
    db.from('program_enrollments').select('id',{count:'exact',head:true}).eq('enrollment_state','active').eq('docs_verified',false),
    db.from('credential_verification').select('id',{count:'exact',head:true}).eq('verification_status','pending'),
    db.from('compliance_flags').select('id',{count:'exact',head:true}).eq('resolved',false).then(r=>r.error?{count:0,error:null}:r),
  ]);

  const quickBooksBillingOk = Boolean(billingConfig.data?.enabled);
  const quickBooksWebhookOk = Boolean(process.env.QB_WEBHOOK_VERIFIER_TOKEN);
  if (!quickBooksBillingOk) alerts.push({ code:'quickbooks_billing_not_ready', severity:'critical', message:'QuickBooks billing provider is not enabled.' });
  if (!quickBooksWebhookOk) alerts.push({ code:'quickbooks_webhook_config_missing', severity:'critical', message:'QuickBooks webhook verifier is not configured.' });
  const staleJobCount=staleJobs.count??0;
  if(staleJobCount>0) alerts.push({code:'stale_jobs',severity:'warning',message:`${staleJobCount} job${staleJobCount>1?'s':''} stuck in processing for >30 min.`});
  return { quickBooksWebhookOk, quickBooksBillingOk, buildEnvOk, staleJobs:staleJobCount, degraded:alerts.some(a=>a.severity==='critical'), missingDocuments:missingDocs.count??0, missingCertifications:missingCertifications.count??0, unresolvedFlags:unresolvedFlags.count??0, alerts };
}
