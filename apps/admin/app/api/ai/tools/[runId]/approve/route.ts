import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { executeRegisteredAITool } from '@/lib/ai/tools/executor';
import { getAITool, type AIAgentId } from '@/lib/ai/tools/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { runId } = await params;
  const body = await request.json().catch(() => ({}));
  const requestedAgent = typeof body.agent === 'string' ? body.agent.toUpperCase() : 'PARIS';
  if (!['PARIS', 'ELLIE', 'LIZZY', 'ZORA', 'ROUTER'].includes(requestedAgent)) {
    return NextResponse.json({ error: 'Invalid agent' }, { status: 400 });
  }
  const agent = requestedAgent as AIAgentId;

  const db: any = await requireAdminClient();
  const [{ data: profile }, { data: pendingRun, error: runError }] = await Promise.all([
    db.from('profiles').select('tenant_id').eq('id', auth.id).maybeSingle(),
    db
      .from('ai_tool_runs')
      .select('id, tool_name, input, status, approval_status, correlation_id, idempotency_key')
      .eq('id', runId)
      .maybeSingle(),
  ]);

  if (runError || !pendingRun) {
    return NextResponse.json({ error: 'Approval request not found.' }, { status: 404 });
  }
  if (pendingRun.status !== 'approval_required' || pendingRun.approval_status !== 'pending') {
    return NextResponse.json({ error: 'This tool run is not awaiting approval.' }, { status: 409 });
  }

  const tool = getAITool(String(pendingRun.tool_name ?? ''));
  if (!tool || !tool.approvalRequired) {
    return NextResponse.json({ error: 'Registered approval tool was not found.' }, { status: 409 });
  }
  if (!tool.allowedAgents.includes(agent)) {
    return NextResponse.json({ error: 'Agent is not allowed to execute this tool.' }, { status: 403 });
  }

  await db
    .from('ai_tool_runs')
    .update({
      approval_status: 'approved',
      approved_by: auth.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .eq('approval_status', 'pending');

  const origin = request.nextUrl.origin;
  const result = await executeRegisteredAITool(
    tool.name,
    pendingRun.input && typeof pendingRun.input === 'object' ? pendingRun.input : {},
    {
      agent,
      actorId: auth.id,
      actorRoles: auth.effectiveRoles,
      tenantId: profile?.tenant_id ?? null,
      correlationId: pendingRun.correlation_id ?? runId,
      idempotencyKey: pendingRun.idempotency_key ?? `approved:${runId}`,
      confirmationText: tool.confirmationPhrase ?? `CONFIRM ${tool.name.toUpperCase()}`,
      requestHeaders: request.headers,
      adminOrigin: origin,
      appOrigin: process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
    },
  );

  await db
    .from('ai_tool_runs')
    .update({
      status: result.ok ? 'completed' : result.status,
      output: result.payload ?? null,
      error: result.error ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);

  return NextResponse.json(result, { status: result.ok ? 200 : result.httpStatus || 409 });
}
