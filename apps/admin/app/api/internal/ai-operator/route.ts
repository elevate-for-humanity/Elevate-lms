import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

async function inspectBillingSetup(db: any, userId: string) {
  const { data: profile } = await db.from('profiles')
    .select('email,full_name')
    .eq('id', userId)
    .maybeSingle();
  if (!profile?.email) return { configured: false, reason: 'billing profile unavailable' };

  const externalKeys = [userId, `user:${userId}`];
  const [{ data: schedules }, { data: invoices }] = await Promise.all([
    db.from('billing_schedules')
      .select('id,status,customer_external_key')
      .in('customer_external_key', externalKeys)
      .in('status', ['active', 'pending'])
      .limit(1),
    db.from('billing_invoices')
      .select('id,provider,status,customer_external_key')
      .in('customer_external_key', externalKeys)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const configured = Boolean(schedules?.length || invoices?.length);
  return {
    configured,
    reason: configured ? 'billing configured' : 'billing setup requires review',
    provider: invoices?.[0]?.provider || 'quickbooks',
  };
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
      if (args.workflow === 'billing_setup' && job.user_id) {
        const result = await inspectBillingSetup(db, job.user_id);
        await db.from('platform_incidents').update({
          status: result.configured ? 'resolved' : 'identified',
          identified_at: new Date().toISOString(),
          resolved_at: result.configured ? new Date().toISOString() : null,
          root_cause: 'The billing workflow required validation against the current provider-neutral billing records.',
          remediation: result.configured
            ? 'Validated the current billing schedule or invoice record. The user can retry the secure billing action.'
            : `Automated repair paused: ${result.reason}`,
        }).eq('id', args.incident_id);
        await db.from('devstudio_jobs').update({
          status: 'completed',
          finished_at: new Date().toISOString(),
          log_lines: ['PARIS captured the authenticated workflow failure.', `Dev Studio result: ${result.reason}.`],
        }).eq('id', job.id);
        results.push({ id: job.id, status: 'completed' });
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
