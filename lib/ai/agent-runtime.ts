import 'server-only';

import { randomUUID } from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import { aiChatWithTools, aiReason, type ToolDefinition } from '@/lib/ai/ai-service';
import { AnthropicProvider } from '@/lib/ai/providers';
import { executeAITool, type AIToolActor } from '@/lib/ai/tools/executor';
import { listAIToolsForAgent, type ElevateAgent } from '@/lib/ai/tools/registry';
import { logger } from '@/lib/logger';

const AGENT_PROMPTS: Record<ElevateAgent, string> = {
  PARIS: `You are PARIS, Elevate's admissions, sales, case-management and administrative AI operator. Use registered tools whenever the user asks about live platform records. Never invent participant, application, funding, compliance, payment or enrollment data. Read tools may execute automatically. Write tools must remain pending until a human administrator approves them.`,
  ELLIE: `You are ELLIE, Elevate's learner-support AI operator. Use live tools for learner, enrollment and program facts. Never fabricate student records or completion data.`,
  LIZZY: `You are LIZZY, Elevate's operations AI operator. Use live tools for operational records and alerts. Explain what was found and what action is recommended.`,
  ZORA: `You are ZORA, Elevate's compliance and workforce AI operator. Use live tools for workforce and compliance records. Treat compliance decisions as high risk and require human approval for writes.`,
  ROUTER: `You are Elevate's AI router. Select the minimum necessary live tools and never invent database facts.`,
};

function roleCanSeeTool(actor: AIToolActor, requiredRoles: string[]): boolean {
  if (actor.roles.includes('admin') || actor.roles.includes('super_admin')) return true;
  return actor.roles.some((role) => requiredRoles.includes(role));
}

function toolDefinitions(agent: ElevateAgent, actor: AIToolActor): ToolDefinition[] {
  return listAIToolsForAgent(agent)
    .filter((tool) => roleCanSeeTool(actor, tool.requiredRoles))
    .map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: `${tool.description} Risk: ${tool.risk}. ${tool.requiresApproval ? 'Requires human approval before execution.' : 'Read-only/approved for immediate execution.'}`,
        parameters: tool.inputSchema,
      },
    }));
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2).slice(0, 40_000);
  } catch {
    return String(value).slice(0, 40_000);
  }
}

export async function runAdminAgentCommand(params: {
  agent: ElevateAgent;
  command: string;
  actor: AIToolActor;
  context?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  message: string;
  taskId?: string;
  provider?: string;
  toolRuns?: Array<{ tool: string; runId?: string; pendingApproval?: boolean; ok: boolean }>;
}> {
  const command = params.command.trim();
  if (!command) return { success: false, message: 'Command is required.' };

  const db: any = await requireAdminClient();
  const correlationId = randomUUID();
  const startedAt = Date.now();

  const { data: task, error: taskError } = await db
    .from('ai_tasks')
    .insert({
      title: `${params.agent} admin command`,
      description: command.slice(0, 2000),
      status: 'in_progress',
      priority: 'medium',
      requested_by: params.actor.id,
      user_id: params.actor.id,
      tenant_id: params.actor.tenantId ?? null,
      trace_id: correlationId,
      correlation_id: correlationId,
      agent_type: params.agent,
      intent: 'OPS',
      payload: { command, context: params.context ?? {} },
      started_at: new Date().toISOString(),
      attempts: 1,
    })
    .select('id')
    .maybeSingle();

  if (taskError) {
    logger.warn('[ai-runtime] task record creation failed', { error: taskError.message });
  }

  const tools = toolDefinitions(params.agent, params.actor);
  const messages = [
    { role: 'system' as const, content: AGENT_PROMPTS[params.agent] },
    {
      role: 'user' as const,
      content: `${command}\n\nDashboard context: ${safeJson(params.context ?? {})}`,
    },
  ];

  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const textParts: string[] = [];
  let provider = 'default';

  try {
    const claude = new AnthropicProvider();
    if (claude.isAvailable()) {
      provider = 'anthropic';
      for await (const event of claude.chatWithTools({
        messages,
        tools,
        temperature: 0.2,
        maxTokens: 1800,
      })) {
        if (event.type === 'tool_call') toolCalls.push({ name: event.name, args: event.args });
        else if (event.content) textParts.push(event.content);
      }
    } else {
      for await (const event of aiChatWithTools({
        messages,
        tools,
        temperature: 0.2,
        maxTokens: 1800,
      })) {
        if (event.type === 'tool_call') toolCalls.push({ name: event.name, args: event.args });
        else if (event.content) textParts.push(event.content);
      }
    }

    const results: Array<{ tool: string; result: Awaited<ReturnType<typeof executeAITool>> }> = [];
    for (const call of toolCalls.slice(0, 6)) {
      const result = await executeAITool({
        toolName: call.name,
        input: call.args,
        agent: params.agent,
        actor: params.actor,
        taskId: task?.id ?? null,
        correlationId,
        idempotencyKey: `ai:${correlationId}:${call.name}`,
      });
      results.push({ tool: call.name, result });
    }

    let message = textParts.join('\n').trim();
    if (results.length) {
      const synthesis = await aiReason({
        provider: provider === 'anthropic' ? 'anthropic' : undefined,
        temperature: 0.2,
        maxTokens: 2200,
        messages: [
          {
            role: 'system',
            content: `${AGENT_PROMPTS[params.agent]} Summarize the live tool results for the administrator. Clearly distinguish completed reads from write actions awaiting human approval. Do not claim an action executed when pendingApproval is true.`,
          },
          {
            role: 'user',
            content: `Original command:\n${command}\n\nLive tool results:\n${safeJson(results)}`,
          },
        ],
      });
      message = synthesis.content.trim() || message;
    }

    if (!message) {
      const response = await aiReason({
        provider: provider === 'anthropic' ? 'anthropic' : undefined,
        temperature: 0.3,
        maxTokens: 1800,
        messages: [
          { role: 'system', content: AGENT_PROMPTS[params.agent] },
          { role: 'user', content: command },
        ],
      });
      message = response.content;
    }

    if (task?.id) {
      await db
        .from('ai_tasks')
        .update({
          status: results.some((item) => item.result.pendingApproval) ? 'pending_approval' : 'completed',
          result: { message, provider, tools: results },
          result_json: { message, provider, tools: results },
          completed_at: results.some((item) => item.result.pendingApproval) ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);
    }

    await db.from('ai_gateway_logs').insert({
      request_id: correlationId,
      agent_type: params.agent,
      intent: 'OPS',
      message: command,
      context: params.context ?? {},
      response: { message, tools: results },
      latency_ms: Date.now() - startedAt,
      status: 'success',
      correlation_id: correlationId,
      tenant_id: params.actor.tenantId ?? null,
      actor_id: params.actor.id,
    });

    return {
      success: true,
      message,
      taskId: task?.id,
      provider,
      toolRuns: results.map((item) => ({
        tool: item.tool,
        runId: item.result.runId,
        pendingApproval: item.result.pendingApproval,
        ok: item.result.ok,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (task?.id) {
      await db
        .from('ai_tasks')
        .update({
          status: 'failed',
          error_message: message,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);
    }
    logger.error('[ai-runtime] command failed', error instanceof Error ? error : undefined, {
      correlationId,
      agent: params.agent,
    });
    return { success: false, message: 'The AI command could not be completed.', taskId: task?.id };
  }
}
