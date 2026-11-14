import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const SAFE_WORKFLOWS = new Set([
  'billing_setup',
  'document_upload',
  'agreement_signing',
  'onboarding',
  'attendance',
  'course_access',
  'progress_reporting',
]);

// The existing primary key makes retries for one incident atomic without
// resetting a completed job or introducing another queue/schema.
function diagnosticId(userId: string, incidentId: string) {
  const bytes = createHash('sha256').update(JSON.stringify(['portal-workflow-diagnostic', userId, incidentId])).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const workflow = String(body.workflow || '').slice(0, 80);
  if (!SAFE_WORKFLOWS.has(workflow)) {
    return NextResponse.json({ error: 'Unsupported workflow.' }, { status: 400 });
  }
  const page = String(body.page || '').slice(0, 300);
  const message = String(body.message || 'Portal workflow failed.').slice(0, 500);
  const status = Number.isFinite(Number(body.status)) ? Number(body.status) : null;
  let incidentId: string | undefined;
  try {
    const db = await requireAdminClient();
    const { data: profile, error: profileError } = await db.from('profiles').select('tenant_id,role').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: 'An authenticated profile is required.' }, { status: 403 });
    const tenantId = profile.tenant_id ?? null;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    let duplicateQuery = db.from('platform_incidents').select('id,tenant_id,created_by,affected_services')
      .eq('created_by', user.id).eq('incident_type', 'workflow')
      .contains('affected_services', [workflow]).gte('created_at', tenMinutesAgo)
      .in('status', ['investigating', 'identified', 'monitoring'])
      .order('created_at', { ascending: false }).limit(1);
    duplicateQuery = tenantId === null ? duplicateQuery.is('tenant_id', null) : duplicateQuery.eq('tenant_id', tenantId);
    const { data: duplicate, error: duplicateError } = await duplicateQuery.maybeSingle();
    if (duplicateError) throw duplicateError;
    let incident = duplicate;
    if (!incident) {
      const saved = await db.from('platform_incidents').insert({
        tenant_id: tenantId, incident_type: 'workflow',
        severity: status && status >= 500 ? 'medium' : 'low',
        title: `Portal workflow needs attention: ${workflow.replaceAll('_', ' ')}`,
        description: message, affected_services: [workflow], status: 'investigating', created_by: user.id,
        impact_assessment: JSON.stringify({ page, status, role: profile.role || null }),
      }).select('id,tenant_id,created_by,affected_services').single();
      if (saved.error || !saved.data) throw new Error('INCIDENT_WRITE_UNCONFIRMED');
      incident = saved.data;
    }
    if (incident.created_by !== user.id || (incident.tenant_id ?? null) !== tenantId ||
        !incident.affected_services?.includes(workflow)) {
      return NextResponse.json({ error: 'The saved incident does not match this authenticated workflow.' }, { status: 409 });
    }
    incidentId = incident.id;

    // Honor legacy jobs with generated IDs, including completed diagnostics.
    // A duplicate incident is acknowledged only after its handoff is proven.
    const fields = 'id,user_id,tool_name,tool_args,status';
    const existing = await db.from('devstudio_jobs').select(fields)
      .eq('user_id', user.id).eq('tool_name', 'workflow_diagnostic')
      .eq('tool_args->>incident_id', incident.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (existing.error) throw existing.error;
    let job = existing.data;
    if (!job) {
      const id = diagnosticId(user.id, incident.id);
      const inserted = await db.from('devstudio_jobs').insert({
        id, user_id: user.id, command: `Diagnose portal workflow incident ${incident.id}`,
        status: 'running', tool_name: 'workflow_diagnostic',
        tool_args: { incident_id: incident.id, workflow, page, status },
        log_lines: ['PARIS captured the authenticated workflow failure.', 'Waiting for Dev Studio diagnostic processing.'],
      }).select(fields).single();
      if (inserted.error?.code === '23505') {
        const concurrent = await db.from('devstudio_jobs').select(fields).eq('id', id).maybeSingle();
        if (concurrent.error) throw concurrent.error;
        job = concurrent.data;
      } else {
        if (inserted.error) throw inserted.error;
        job = inserted.data;
      }
      if (!job) throw new Error('DIAGNOSTIC_WRITE_UNCONFIRMED');
    }
    if (job.user_id !== user.id || job.tool_name !== 'workflow_diagnostic' ||
        job.tool_args?.incident_id !== incident.id || job.tool_args?.workflow !== workflow) {
      return NextResponse.json({ error: 'The saved diagnostic does not match this authenticated workflow.', incidentId }, { status: 409 });
    }
    const receipt = { incidentId, diagnosticJobId: job.id, diagnosticStatus: job.status, duplicate: Boolean(duplicate) };
    if (!['running', 'completed'].includes(job.status)) {
      return NextResponse.json({ error: 'This diagnostic requires administrator review.', ...receipt }, { status: 409 });
    }
    return NextResponse.json({ ok: true, ...receipt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'The workflow diagnostic could not be confirmed. Please retry.', ...(incidentId ? { incidentId } : {}) }, { status: 503 });
  }
}

export const POST = withApiAudit('/api/paris/workflow-incident', _POST);
