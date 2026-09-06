import { NextRequest, NextResponse } from 'next/server';
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
  const db = await requireAdminClient();

  const { data: profile } = await db.from('profiles').select('tenant_id,role').eq('id', user.id).maybeSingle();
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: duplicate } = await db.from('platform_incidents').select('id')
    .eq('created_by', user.id)
    .eq('incident_type', 'workflow')
    .contains('affected_services', [workflow])
    .gte('created_at', tenMinutesAgo)
    .in('status', ['investigating', 'identified', 'monitoring'])
    .limit(1)
    .maybeSingle();
  if (duplicate) return NextResponse.json({ ok: true, incidentId: duplicate.id, duplicate: true });

  const { data: incident, error } = await db.from('platform_incidents').insert({
    tenant_id: profile?.tenant_id || null,
    incident_type: 'workflow',
    severity: status && status >= 500 ? 'medium' : 'low',
    title: `Portal workflow needs attention: ${workflow.replaceAll('_', ' ')}`,
    description: message,
    affected_services: [workflow],
    status: 'investigating',
    created_by: user.id,
    impact_assessment: JSON.stringify({ page, status, role: profile?.role || null }),
  }).select('id').single();
  if (error || !incident) return NextResponse.json({ error: 'Issue could not be queued.' }, { status: 500 });

  await db.from('devstudio_jobs').insert({
    user_id: user.id,
    command: `Diagnose portal workflow incident ${incident.id}`,
    status: 'running',
    tool_name: 'workflow_diagnostic',
    tool_args: { incident_id: incident.id, workflow, page, status },
    log_lines: ['PARIS captured the authenticated workflow failure.', 'Waiting for Dev Studio diagnostic processing.'],
  });

  return NextResponse.json({ ok: true, incidentId: incident.id });
}

export const POST = withApiAudit('/api/paris/workflow-incident', _POST);
