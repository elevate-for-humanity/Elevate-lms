import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { loadBillingProviderConfig } from '@/lib/billing/config';
import { ensureQuickBooksCustomer } from '@/lib/billing/providers/quickbooks';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

async function repairBillingSetup(db: any, userId: string | null) {
  if (!userId) return { repaired: false, reason: 'A user is required for billing setup.' };
  const { data: profile, error: profileError } = await db.from('profiles')
    .select('email,full_name').eq('id', userId).maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.email) return { repaired: false, reason: 'The user profile needs an email address.' };

  const { data: schedules, error: scheduleError } = await db.from('billing_schedules')
    .select('id,provider,status,collection_mode,provider_status,customer_name,customer_email')
    .in('customer_external_key', [userId, `user:${userId}`])
    .eq('provider', 'quickbooks').eq('status', 'active').limit(1);
  if (scheduleError) throw scheduleError;
  const schedule = schedules?.[0];
  if (!schedule) return { repaired: false, reason: 'No active QuickBooks billing schedule exists for this user.' };
  if (schedule.collection_mode === 'automatic' && schedule.provider_status !== 'active') {
    return { repaired: false, reason: 'The user must authorize PayPal automatic payments first.' };
  }
  if (String(schedule.customer_email).toLowerCase() !== String(profile.email).toLowerCase()) {
    return { repaired: false, reason: 'The billing schedule email does not match the user profile.' };
  }

  const { primary } = await loadBillingProviderConfig(db);
  if (primary === 'paypal') {
    return { repaired: false, reason: 'PayPal payment authorization must be completed by the user.' };
  }

  await ensureQuickBooksCustomer(db, {
    externalKey: `user:${userId}`,
    displayName: schedule.customer_name || profile.full_name || profile.email,
    email: schedule.customer_email,
  });
  return { repaired: true, reason: 'QuickBooks customer verified for the existing billing schedule.' };
}

async function _POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await hydrateProcessEnv();
  const db = await requireAdminClient();
  const { data: jobs, error } = await db.from('devstudio_jobs')
    .select('id,user_id,tool_args')
    .eq('tool_name', 'workflow_diagnostic')
    .eq('status', 'running')
    .order('created_at', { ascending: true })
    .limit(10);
  if (error) return NextResponse.json({ error: 'Diagnostic queue unavailable.' }, { status: 500 });

  const results: Array<{ id: string; status: string }> = [];
  for (const job of jobs || []) {
    const args = (job.tool_args || {}) as { incident_id?: string; workflow?: string };
    try {
      if (args.workflow === 'billing_setup') {
        const result = await repairBillingSetup(db, job.user_id);
        await db.from('platform_incidents').update({
          status: result.repaired ? 'resolved' : 'identified',
          identified_at: new Date().toISOString(),
          resolved_at: result.repaired ? new Date().toISOString() : null,
          root_cause: 'Current billing setup needs a provider customer or user authorization.',
          remediation: result.reason,
        }).eq('id', args.incident_id);
        await db.from('devstudio_jobs').update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          log_lines: ['PARIS captured the authenticated workflow failure.', `Billing setup result: ${result.reason}`],
        }).eq('id', job.id);
        results.push({ id: job.id, status: result.repaired ? 'completed' : 'review_required' });
        continue;
      }

      const { data: incident } = await db.from('platform_incidents').select('tenant_id').eq('id', args.incident_id).maybeSingle();
      await db.from('platform_incidents').update({
        status: 'identified',
        identified_at: new Date().toISOString(),
        remediation: 'Dev Studio diagnostic created. A privileged change requires administrator review.',
      }).eq('id', args.incident_id);
      await db.from('platform_control_actions').insert({
        tenant_id: incident?.tenant_id || null,
        action_type: 'workflow_repair',
        target_service: args.workflow || 'portal',
        parameters: { incident_id: args.incident_id, devstudio_job_id: job.id },
        status: 'pending',
        triggered_by: job.user_id,
        requires_approval: true,
        approval_status: 'pending',
      });
      await db.from('devstudio_jobs').update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        log_lines: ['PARIS captured the authenticated workflow failure.', 'Dev Studio diagnosed the workflow and opened an approval-gated repair action.'],
      }).eq('id', job.id);
      results.push({ id: job.id, status: 'review_required' });
    } catch (jobError) {
      await db.from('devstudio_jobs').update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        log_lines: ['PARIS captured the authenticated workflow failure.', `Diagnostic failed: ${jobError instanceof Error ? jobError.message : 'unknown error'}`],
      }).eq('id', job.id);
      results.push({ id: job.id, status: 'failed' });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}

export const POST = withApiAudit('/api/internal/ai-operator', _POST);
