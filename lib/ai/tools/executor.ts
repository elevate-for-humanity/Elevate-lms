import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { emitPlatformEvent } from '@/lib/platform/orchestration/events';
import { logger } from '@/lib/logger';
import { getAITool, type AIAgentId, type AIToolDefinition } from './registry';

export type AIToolExecutionContext = {
  agent: AIAgentId;
  actorId: string;
  actorRoles: readonly string[];
  tenantId?: string | null;
  correlationId?: string | null;
  confirmationText?: unknown;
  requestHeaders?: Headers | Record<string, string | null | undefined>;
  adminOrigin: string;
  appOrigin?: string;
  idempotencyKey?: string | null;
};

export type AIToolExecutionResult = {
  ok: boolean;
  status: 'completed' | 'accepted' | 'failed' | 'blocked' | 'approval_required';
  httpStatus: number;
  tool: string;
  risk: AIToolDefinition['risk'];
  classification: AIToolDefinition['classification'];
  approvalRequired: boolean;
  requiredConfirmation?: string;
  payload?: unknown;
  error?: string;
  traceId?: string | null;
};

function hasRole(actual: readonly string[], allowed: readonly string[]): boolean {
  return actual.some((role) => allowed.includes(role));
}

function validateRequiredInput(tool: AIToolDefinition, input: Record<string, unknown>): string | null {
  for (const key of tool.requiredInput ?? []) {
    const value = input[key];
    if (value === undefined || value === null || value === '') return key;
  }
  return null;
}

function headerValue(headers: AIToolExecutionContext['requestHeaders'], name: string): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && typeof value === 'string') return value;
  }
  return null;
}

function toolUrl(tool: AIToolDefinition, input: Record<string, unknown>, context: AIToolExecutionContext): string {
  const path = typeof tool.path === 'function' ? tool.path(input) : tool.path;
  const isAdminControlPlane = path.startsWith('/api/admin/') || path.startsWith('/api/admin/dev-studio/');
  const origin = isAdminControlPlane
    ? context.adminOrigin
    : context.appOrigin ?? context.adminOrigin;
  return `${origin.replace(/\/$/, '')}${path}`;
}

async function writeToolRun(
  tool: AIToolDefinition,
  context: AIToolExecutionContext,
  input: Record<string, unknown>,
  fields: {
    status: string;
    output?: unknown;
    error?: string | null;
    startedAt?: string;
    completedAt?: string | null;
  },
): Promise<string | null> {
  try {
    const db = await requireAdminClient();
    const row = {
      actor_id: context.actorId,
      actor_role: context.actorRoles[0] ?? null,
      tenant_id: context.tenantId ?? null,
      agent_id: context.agent,
      tool_name: tool.name,
      classification: tool.classification,
      risk_level: tool.risk,
      approval_required: tool.approvalRequired,
      approval_status: tool.approvalRequired
        ? fields.status === 'approval_required' ? 'pending' : 'approved'
        : 'not_required',
      input,
      output: fields.output ?? null,
      status: fields.status,
      idempotency_key: context.idempotencyKey ?? null,
      correlation_id: context.correlationId ?? null,
      error: fields.error ?? null,
      started_at: fields.startedAt ?? new Date().toISOString(),
      completed_at: fields.completedAt ?? null,
    };
    const { data, error } = await db.from('ai_tool_runs').insert(row).select('id').maybeSingle();
    if (error) {
      logger.warn('[ai-tool-executor] ai_tool_runs unavailable; continuing with platform event audit', { tool: tool.name, error: error.message });
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    logger.warn('[ai-tool-executor] tool run persistence failed', { tool: tool.name, error: String(error) });
    return null;
  }
}

async function emitAuditEvent(
  tool: AIToolDefinition,
  context: AIToolExecutionContext,
  input: Record<string, unknown>,
  status: string,
  extra: Record<string, unknown> = {},
): Promise<string | null> {
  try {
    const db = await requireAdminClient();
    const result = await emitPlatformEvent(db, {
      eventType: `ai.tool.${status}`,
      category: 'ai',
      source: 'ai.tool-executor',
      actorId: context.actorId,
      actorType: context.actorRoles[0] ?? 'staff',
      tenantId: context.tenantId ?? null,
      subjectType: 'ai_tool',
      subjectId: tool.name,
      correlationId: context.correlationId ?? null,
      idempotencyKey: context.idempotencyKey
        ? `ai-tool:${tool.name}:${context.idempotencyKey}:${status}`
        : null,
      dispatch: false,
      severity: status === 'failed' ? 'error' : status === 'blocked' ? 'warning' : 'info',
      payload: {
        tool: tool.name,
        classification: tool.classification,
        risk: tool.risk,
        approval_required: tool.approvalRequired,
        input,
        ...extra,
      },
    });
    return result.id;
  } catch (error) {
    logger.warn('[ai-tool-executor] platform event audit failed', { tool: tool.name, error: String(error) });
    return null;
  }
}

export async function executeRegisteredAITool(
  toolName: string,
  input: Record<string, unknown>,
  context: AIToolExecutionContext,
): Promise<AIToolExecutionResult> {
  const tool = getAITool(toolName);
  if (!tool) {
    return {
      ok: false,
      status: 'blocked',
      httpStatus: 404,
      tool: toolName,
      risk: 'low',
      classification: 'read',
      approvalRequired: false,
      error: 'Tool is not registered.',
    };
  }

  if (!tool.allowedAgents.includes(context.agent)) {
    await emitAuditEvent(tool, context, input, 'blocked', { reason: 'agent_not_authorized' });
    return {
      ok: false,
      status: 'blocked',
      httpStatus: 403,
      tool: tool.name,
      risk: tool.risk,
      classification: tool.classification,
      approvalRequired: tool.approvalRequired,
      error: `${context.agent} is not authorized to use ${tool.name}.`,
    };
  }

  if (!hasRole(context.actorRoles, tool.allowedRoles)) {
    await emitAuditEvent(tool, context, input, 'blocked', { reason: 'role_not_authorized' });
    return {
      ok: false,
      status: 'blocked',
      httpStatus: 403,
      tool: tool.name,
      risk: tool.risk,
      classification: tool.classification,
      approvalRequired: tool.approvalRequired,
      error: 'Authenticated role is not authorized for this tool.',
    };
  }

  const missing = validateRequiredInput(tool, input);
  if (missing) {
    return {
      ok: false,
      status: 'blocked',
      httpStatus: 400,
      tool: tool.name,
      risk: tool.risk,
      classification: tool.classification,
      approvalRequired: tool.approvalRequired,
      error: `Missing required input: ${missing}`,
    };
  }

  if (tool.approvalRequired) {
    const required = tool.confirmationPhrase ?? `CONFIRM ${tool.name.toUpperCase()}`;
    if (typeof context.confirmationText !== 'string' || context.confirmationText !== required) {
      await writeToolRun(tool, context, input, { status: 'approval_required' });
      await emitAuditEvent(tool, context, input, 'approval_required', { required_confirmation: required });
      return {
        ok: false,
        status: 'approval_required',
        httpStatus: 409,
        tool: tool.name,
        risk: tool.risk,
        classification: tool.classification,
        approvalRequired: true,
        requiredConfirmation: required,
        error: 'Human approval is required before this tool can execute.',
      };
    }
  }

  const startedAt = new Date().toISOString();
  const eventId = await emitAuditEvent(tool, context, input, 'started');
  const url = toolUrl(tool, input, context);
  const headers = new Headers({ accept: 'application/json' });
  const cookie = headerValue(context.requestHeaders, 'cookie');
  const authorization = headerValue(context.requestHeaders, 'authorization');
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);
  headers.set('x-elevate-ai-agent', context.agent);
  if (context.correlationId) headers.set('x-correlation-id', context.correlationId);
  if (context.idempotencyKey) headers.set('idempotency-key', context.idempotencyKey);

  const attempts = Math.max(1, tool.retryAttempts);
  let lastError = '';
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const init: RequestInit = {
        method: tool.method,
        headers,
        signal: AbortSignal.timeout(tool.timeoutMs),
      };
      if (tool.method === 'POST') {
        headers.set('content-type', 'application/json');
        init.body = JSON.stringify(input);
      }
      const response = await fetch(url, init);
      const contentType = response.headers.get('content-type') ?? '';
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        : await response.text().catch(() => '');

      if (!response.ok) {
        lastError = typeof payload === 'object' && payload && 'error' in payload
          ? String((payload as { error?: unknown }).error ?? `HTTP ${response.status}`)
          : `HTTP ${response.status}`;
        if (attempt < attempts && response.status >= 500 && tool.classification === 'read') continue;
        await writeToolRun(tool, context, input, {
          status: 'failed',
          output: payload,
          error: lastError,
          startedAt,
          completedAt: new Date().toISOString(),
        });
        await emitAuditEvent(tool, context, input, 'failed', { http_status: response.status, error: lastError, source_event_id: eventId });
        return {
          ok: false,
          status: 'failed',
          httpStatus: response.status,
          tool: tool.name,
          risk: tool.risk,
          classification: tool.classification,
          approvalRequired: tool.approvalRequired,
          payload,
          error: lastError,
          traceId: eventId,
        };
      }

      const payloadStatus =
        payload && typeof payload === 'object' && 'status' in payload
          ? String((payload as { status?: unknown }).status ?? '').toLowerCase()
          : '';
      const accepted = response.status === 202 || payloadStatus === 'queued' || payloadStatus === 'running';
      if (accepted) {
        await writeToolRun(tool, context, input, {
          status: 'accepted',
          output: payload,
          startedAt,
        });
        await emitAuditEvent(tool, context, input, 'accepted', { http_status: response.status, source_event_id: eventId });
        return {
          ok: true,
          status: 'accepted',
          httpStatus: response.status,
          tool: tool.name,
          risk: tool.risk,
          classification: tool.classification,
          approvalRequired: tool.approvalRequired,
          payload,
          traceId: eventId,
        };
      }

      await writeToolRun(tool, context, input, {
        status: 'completed',
        output: payload,
        startedAt,
        completedAt: new Date().toISOString(),
      });
      await emitAuditEvent(tool, context, input, 'completed', { http_status: response.status, source_event_id: eventId });
      return {
        ok: true,
        status: 'completed',
        httpStatus: response.status,
        tool: tool.name,
        risk: tool.risk,
        classification: tool.classification,
        approvalRequired: tool.approvalRequired,
        payload,
        traceId: eventId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts && tool.classification === 'read') continue;
    }
  }

  await writeToolRun(tool, context, input, {
    status: 'failed',
    error: lastError || 'Tool execution failed.',
    startedAt,
    completedAt: new Date().toISOString(),
  });
  await emitAuditEvent(tool, context, input, 'failed', { error: lastError, source_event_id: eventId });
  return {
    ok: false,
    status: 'failed',
    httpStatus: 500,
    tool: tool.name,
    risk: tool.risk,
    classification: tool.classification,
    approvalRequired: tool.approvalRequired,
    error: lastError || 'Tool execution failed.',
    traceId: eventId,
  };
}
