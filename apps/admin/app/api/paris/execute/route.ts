import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { executeAICommand } from '@/lib/ai/runtime/command-executor';
import type { AIAgentId } from '@/lib/ai/tools/registry';
import type { AITask } from '@/lib/ai/execute-ai-task';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const AGENT_MAP: Record<string, { agent: AIAgentId; label: string; task: AITask; role: string }> = {
  'course-orchestrator': { agent: 'LIZZY', label: 'Course Orchestrator', task: 'general_chat', role: 'course operations and curriculum execution' },
  'instructional-designer': { agent: 'LIZZY', label: 'Instructional Designer', task: 'general_chat', role: 'instructional design and curriculum quality' },
  'qa-designer': { agent: 'ZORA', label: 'QA Designer', task: 'diagnostics', role: 'quality assurance, accessibility, and compliance review' },
  'marketing-content': { agent: 'PARIS', label: 'Marketing Content Creator', task: 'social_generation', role: 'sales and marketing content' },
  'marketing-social': { agent: 'PARIS', label: 'Social Media Manager', task: 'social_generation', role: 'social marketing and audience conversion' },
  'marketing-video': { agent: 'PARIS', label: 'Video Script Writer', task: 'social_generation', role: 'commercial video scripting and conversion copy' },
  'workforce-agent': { agent: 'ZORA', label: 'Workforce Agent', task: 'general_chat', role: 'workforce, apprenticeship, funding, and compliance operations' },
  'admissions-agent': { agent: 'PARIS', label: 'Admissions Agent', task: 'career_counseling', role: 'admissions, intake, and enrollment guidance' },
  'media-designer': { agent: 'LIZZY', label: 'Media Designer', task: 'general_chat', role: 'media production and accessibility operations' },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function titleFromCommand(command: string): string {
  const oneLine = command.replace(/\s+/g, ' ').trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 117)}…` : oneLine;
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  await hydrateProcessEnv().catch((error) => {
    logger.warn('[paris/execute] secret hydration failed; using runtime environment', { error: String(error) });
  });

  const body = asRecord(await req.json().catch(() => ({})));
  const command = typeof body.command === 'string' ? body.command.trim() : '';
  const agentType = typeof body.agentType === 'string' ? body.agentType : 'admissions-agent';
  const context = asRecord(body.context);

  if (!command) {
    return NextResponse.json({ success: false, message: 'command is required' }, { status: 400 });
  }
  if (command.length > 4000) {
    return NextResponse.json({ success: false, message: 'command is too long' }, { status: 400 });
  }

  const agentConfig = AGENT_MAP[agentType] ?? {
    agent: 'PARIS' as const,
    label: 'PARIS',
    task: 'general_chat' as const,
    role: 'authorized platform assistance',
  };
  const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const respond = (payload: Record<string, unknown>, status = 200) => NextResponse.json(
    { ...payload, correlationId },
    { status, headers: { 'x-correlation-id': correlationId, 'cache-control': 'no-store' } },
  );
  const tenantId = typeof context.tenantId === 'string'
    ? context.tenantId
    : await resolveTenantIdForUser(auth.id).catch(() => null);
  const db = await requireAdminClient();

  const { data: durableTask } = await db
    .from('ai_tasks')
    .insert({
      task_id: correlationId,
      title: titleFromCommand(command),
      description: `PARIS Admin OS command routed through ${agentConfig.label}`,
      command,
      status: 'running',
      priority: 'medium',
      requested_by: auth.id,
      created_by: auth.id,
      user_id: auth.id,
      tenant_id: tenantId,
      agent_type: agentConfig.agent,
      intent: agentType,
      correlation_id: correlationId,
      trace_id: correlationId,
      payload: { agentType, context },
      metadata: { source: '/api/paris/execute', label: agentConfig.label },
      started_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  try {
    const result = await executeAICommand(command, {
      agent: agentConfig.agent,
      agentLabel: agentConfig.label,
      agentRole: agentConfig.role,
      advisoryTask: agentConfig.task,
      actorId: auth.id,
      actorRoles: auth.effectiveRoles,
      tenantId,
      correlationId,
      confirmationText: body.confirmationText,
      requestHeaders: req.headers,
      adminOrigin: req.nextUrl.origin,
      appOrigin: process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
      idempotencyKey: typeof body.idempotencyKey === 'string'
        ? body.idempotencyKey
        : `paris:${correlationId}`,
      commandContext: context,
    });

    if (durableTask?.id) {
      await db.from('ai_tasks').update({
        status: result.status === 'approval_required'
          ? 'awaiting_approval'
          : result.ok ? 'completed' : 'failed',
        requires_approval: result.status === 'approval_required',
        approval_status: result.status === 'approval_required' ? 'pending' : null,
        approval_reason: result.status === 'approval_required'
          ? `Human confirmation required for ${result.tool ?? 'protected tool'}`
          : null,
        tool_name: result.tool ?? null,
        tool_output: result.payload ?? null,
        result: {
          ok: result.ok,
          executed: result.executed,
          message: result.message,
          tool: result.tool ?? null,
        },
        result_json: {
          ok: result.ok,
          executed: result.executed,
          status: result.status,
          message: result.message,
          tool: result.tool ?? null,
          provider: result.provider ?? null,
          trace_id: result.traceId ?? null,
        },
        error_message: result.ok ? null : result.message,
        completed_at: result.status === 'approval_required' ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', durableTask.id);
    }

    if (result.status === 'approval_required') {
      return respond({
        success: false,
        executed: false,
        approvalRequired: true,
        requiredConfirmation: result.requiredConfirmation,
        agent: agentConfig.label,
        tool: result.tool,
        risk: result.risk,
        message: result.requiredConfirmation
          ? `Human approval is required. Type exactly: ${result.requiredConfirmation}`
          : result.message,
        traceId: result.traceId ?? correlationId,
        taskId: durableTask?.id ?? null,
      }, 409);
    }

    if (!result.ok) {
      return respond({
        success: false,
        executed: false,
        agent: agentConfig.label,
        tool: result.tool,
        risk: result.risk,
        message: result.message,
        data: result.payload ?? null,
        traceId: result.traceId ?? correlationId,
        taskId: durableTask?.id ?? null,
      }, result.status === 'blocked' ? 403 : 500);
    }

    logger.info('[paris/execute] canonical command completed', {
      actorId: auth.id,
      agent: agentConfig.agent,
      agentType,
      executed: result.executed,
      tool: result.tool ?? null,
      provider: result.provider ?? null,
      correlationId,
    });

    return respond({
      success: true,
      executed: result.executed,
      agent: agentConfig.label,
      tool: result.tool ?? null,
      risk: result.risk ?? null,
      message: result.message,
      provider: result.provider ?? null,
      data: result.payload ?? null,
      traceId: result.traceId ?? correlationId,
      taskId: durableTask?.id ?? null,
    });
  } catch (error) {
    if (durableTask?.id) {
      await db.from('ai_tasks').update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', durableTask.id);
    }

    logger.error('[paris/execute] canonical execution failed', error instanceof Error ? error : new Error(String(error)), {
      actorId: auth.id,
      agentType,
      correlationId,
    });
    return respond({
      success: false,
      executed: false,
      message: 'The AI execution service could not complete this request.',
      taskId: durableTask?.id ?? null,
    }, 500);
  }
}
