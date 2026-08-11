import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { getAIToolDefinition, type ElevateAgent } from '@/lib/ai/tools/registry';
import { logger } from '@/lib/logger';

export type AIToolActor = {
  id: string;
  roles: string[];
  tenantId?: string | null;
};

export type AIToolExecutionResult = {
  ok: boolean;
  tool: string;
  runId?: string;
  pendingApproval?: boolean;
  data?: unknown;
  error?: string;
};

function clampLimit(value: unknown, fallback = 25): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 100) : fallback;
}

function roleAllowed(actor: AIToolActor, requiredRoles: string[]): boolean {
  if (actor.roles.includes('super_admin') || actor.roles.includes('admin')) return true;
  return actor.roles.some((role) => requiredRoles.includes(role));
}

function cleanSearch(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(/[,%()]/g, ' ').trim().slice(0, 180)
    : '';
}

async function runImplementation(
  toolName: string,
  input: Record<string, unknown>,
  actor: AIToolActor,
) {
  const db: any = await requireAdminClient();

  switch (toolName) {
    case 'applications.search': {
      let query = db
        .from('applications')
        .select('id,first_name,last_name,full_name,email,phone,status,program_id,program_slug,program_interest,funding_status,funding_source,created_at,submitted_at,reviewed_at')
        .order('created_at', { ascending: false })
        .limit(clampLimit(input.limit));
      if (typeof input.status === 'string' && input.status) query = query.eq('status', input.status);
      const program = cleanSearch(input.program);
      if (program) query = query.or(`program_slug.ilike.%${program}%,program_interest.ilike.%${program}%`);
      const search = cleanSearch(input.query);
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return { applications: data ?? [], count: data?.length ?? 0 };
    }

    case 'applications.read': {
      const id = typeof input.id === 'string' ? input.id : '';
      if (!id) throw new Error('Application id is required.');
      const { data, error } = await db
        .from('applications')
        .select('id,first_name,last_name,full_name,email,phone,city,zip,status,program_id,program_slug,program_interest,funding_status,funding_source,review_notes,support_notes,created_at,submitted_at,reviewed_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Application not found.');
      return data;
    }

    case 'applications.updateStatus': {
      const id = typeof input.id === 'string' ? input.id : '';
      const status = typeof input.status === 'string' ? input.status : '';
      const allowedStatuses = new Set([
        'pending',
        'submitted',
        'in_review',
        'under_review',
        'pending_admin_review',
        'approved',
        'rejected',
        'enrolled',
      ]);
      if (!id || !allowedStatuses.has(status)) {
        throw new Error('Valid application id and status are required.');
      }
      const reviewNotes = typeof input.reviewNotes === 'string'
        ? input.reviewNotes.trim().slice(0, 4000)
        : null;
      const { data, error } = await db
        .from('applications')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: actor.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id,status,review_notes,reviewed_at,reviewed_by')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Application not found or update was not permitted.');
      return data;
    }

    case 'programs.search': {
      let query = db
        .from('programs')
        .select('id,slug,title,name,status,category,published,is_active,organization_id,tenant_id,created_at')
        .neq('status', 'archived')
        .order('title', { ascending: true })
        .limit(clampLimit(input.limit, 50));
      if (actor.tenantId && !actor.roles.includes('admin') && !actor.roles.includes('super_admin')) {
        query = query.eq('tenant_id', actor.tenantId);
      }
      const search = cleanSearch(input.query);
      if (search) query = query.or(`title.ilike.%${search}%,name.ilike.%${search}%,slug.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return { programs: data ?? [], count: data?.length ?? 0 };
    }

    case 'enrollments.search': {
      let query = db
        .from('program_enrollments')
        .select('id,user_id,student_id,full_name,email,program_id,program_slug,status,funding_status,funding_source,tenant_id,organization_id,created_at')
        .order('created_at', { ascending: false })
        .limit(clampLimit(input.limit));
      if (actor.tenantId && !actor.roles.includes('admin') && !actor.roles.includes('super_admin')) {
        query = query.eq('tenant_id', actor.tenantId);
      }
      if (typeof input.status === 'string' && input.status) query = query.eq('status', input.status);
      const program = cleanSearch(input.program);
      if (program) query = query.ilike('program_slug', `%${program}%`);
      const search = cleanSearch(input.query);
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return { enrollments: data ?? [], count: data?.length ?? 0 };
    }

    case 'operations.alerts': {
      const { data, error } = await db
        .from('admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(clampLimit(input.limit, 25));
      if (error) throw error;
      return { alerts: data ?? [], count: data?.length ?? 0 };
    }

    default:
      throw new Error(`No executor implementation exists for ${toolName}.`);
  }
}

export async function executeAITool(params: {
  toolName: string;
  input?: Record<string, unknown>;
  agent: ElevateAgent;
  actor: AIToolActor;
  taskId?: string | null;
  correlationId?: string | null;
  approvedByHuman?: boolean;
  idempotencyKey?: string | null;
}): Promise<AIToolExecutionResult> {
  const definition = getAIToolDefinition(params.toolName);
  if (!definition) return { ok: false, tool: params.toolName, error: 'Unknown AI tool.' };
  if (!definition.allowedAgents.includes(params.agent)) {
    return { ok: false, tool: params.toolName, error: 'Agent is not authorized for this tool.' };
  }
  if (!roleAllowed(params.actor, definition.requiredRoles)) {
    return { ok: false, tool: params.toolName, error: 'User role is not authorized for this tool.' };
  }

  const db: any = await requireAdminClient();
  const input = params.input ?? {};
  const pendingApproval = definition.requiresApproval && !params.approvedByHuman;
  const { data: run, error: runError } = await db
    .from('ai_tool_runs')
    .insert({
      task_id: params.taskId ?? null,
      tool_name: params.toolName,
      actor_id: params.actor.id,
      tenant_id: params.actor.tenantId ?? null,
      risk_level: definition.risk,
      requires_approval: definition.requiresApproval,
      approval_status: pendingApproval ? 'pending' : definition.requiresApproval ? 'approved' : 'not_required',
      input,
      status: pendingApproval ? 'pending_approval' : 'running',
      idempotency_key: params.idempotencyKey ?? null,
      started_at: pendingApproval ? null : new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (runError) {
    logger.error('[ai-tools] failed to create run record', runError, { toolName: params.toolName });
    return { ok: false, tool: params.toolName, error: 'Tool run could not be recorded.' };
  }

  if (pendingApproval) {
    return {
      ok: true,
      tool: params.toolName,
      runId: run?.id,
      pendingApproval: true,
      data: { message: 'Human approval is required before this write action can execute.' },
    };
  }

  try {
    const data = await Promise.race([
      runImplementation(params.toolName, input, params.actor),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI tool execution timed out.')), definition.timeoutMs),
      ),
    ]);

    if (run?.id) {
      await db
        .from('ai_tool_runs')
        .update({
          status: 'completed',
          output: data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    return { ok: true, tool: params.toolName, runId: run?.id, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (run?.id) {
      await db
        .from('ai_tool_runs')
        .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
        .eq('id', run.id);
    }
    logger.error('[ai-tools] execution failed', error instanceof Error ? error : undefined, {
      toolName: params.toolName,
      runId: run?.id,
    });
    return { ok: false, tool: params.toolName, runId: run?.id, error: message };
  }
}

export async function approveAndExecuteAITool(params: {
  runId: string;
  approver: AIToolActor;
  agent: ElevateAgent;
}): Promise<AIToolExecutionResult> {
  if (!params.approver.roles.some((role) => role === 'admin' || role === 'super_admin')) {
    return { ok: false, tool: 'unknown', error: 'Administrator approval is required.' };
  }

  const db: any = await requireAdminClient();
  const { data: run, error } = await db
    .from('ai_tool_runs')
    .select('id,tool_name,input,status,approval_status,actor_id,tenant_id')
    .eq('id', params.runId)
    .maybeSingle();
  if (error || !run) return { ok: false, tool: 'unknown', error: 'Tool run not found.' };
  if (run.status !== 'pending_approval' || run.approval_status !== 'pending') {
    return { ok: false, tool: run.tool_name, runId: run.id, error: 'Tool run is not awaiting approval.' };
  }

  await db
    .from('ai_tool_runs')
    .update({ approval_status: 'approved', status: 'running', started_at: new Date().toISOString() })
    .eq('id', run.id)
    .eq('approval_status', 'pending');

  const definition = getAIToolDefinition(run.tool_name);
  if (!definition) return { ok: false, tool: run.tool_name, runId: run.id, error: 'Tool definition no longer exists.' };

  try {
    const data = await Promise.race([
      runImplementation(run.tool_name, run.input ?? {}, {
        id: run.actor_id || params.approver.id,
        roles: params.approver.roles,
        tenantId: run.tenant_id ?? params.approver.tenantId ?? null,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI tool execution timed out.')), definition.timeoutMs),
      ),
    ]);
    await db
      .from('ai_tool_runs')
      .update({ status: 'completed', output: data, completed_at: new Date().toISOString() })
      .eq('id', run.id);
    return { ok: true, tool: run.tool_name, runId: run.id, data };
  } catch (executionError) {
    const message = executionError instanceof Error ? executionError.message : String(executionError);
    await db
      .from('ai_tool_runs')
      .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
      .eq('id', run.id);
    return { ok: false, tool: run.tool_name, runId: run.id, error: message };
  }
}
