import 'server-only';

import { executeAiTask, type AITask } from '@/lib/ai/execute-ai-task';
import { logger } from '@/lib/logger';
import { executeRegisteredAITool, type AIToolExecutionContext } from '@/lib/ai/tools/executor';
import { getAITool, getAIToolCatalogForPrompt, type AIAgentId } from '@/lib/ai/tools/registry';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';

export type AICommandExecutionContext = Omit<AIToolExecutionContext, 'agent'> & {
  agent: AIAgentId;
  agentLabel?: string;
  agentRole?: string;
  advisoryTask?: AITask;
  commandContext?: Record<string, unknown>;
  approvalGranted?: boolean;
};

export type AICommandExecutionResult = {
  ok: boolean;
  executed: boolean;
  status: 'completed' | 'running' | 'failed' | 'blocked' | 'approval_required' | 'advisory';
  message: string;
  tool?: string;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  provider?: string;
  payload?: unknown;
  traceId?: string | null;
  requiredConfirmation?: string;
};

function safeToolData(payload: unknown): string {
  if (payload === null || payload === undefined) return 'No result body.';
  if (typeof payload === 'string') return payload.slice(0, 20_000);
  try {
    return JSON.stringify(payload, null, 2).slice(0, 20_000);
  } catch {
    return String(payload).slice(0, 20_000);
  }
}

function shouldSynthesize(command: string, toolName: string): boolean {
  if (toolName.startsWith('wioa.')) return true;
  return /\b(draft|write|summari[sz]e|narrative|report|analy[sz]e|explain|email|reminder|recommend|what does|tell me)\b/i.test(command);
}

async function synthesizeReadResult(
  command: string,
  toolName: string,
  payload: unknown,
  context: AICommandExecutionContext,
): Promise<{ message: string; provider?: string }> {
  const result = await executeAiTask({
    task: context.advisoryTask ?? 'general_chat',
    prompt: [
      `You are ${context.agentLabel ?? context.agent}, an Elevate workforce/admin AI.`,
      'The data below came from an authenticated live platform tool.',
      'Answer only from that data. Do not invent missing records, eligibility, funding decisions, compliance conclusions, or contact information.',
      'If asked to draft an email/reminder, draft it but do not claim it was sent.',
      'If asked for a performance narrative, clearly label it as a draft for staff review.',
      `Admin request:\n${command}`,
      `Live tool: ${toolName}`,
      `Live result:\n${safeToolData(payload)}`,
    ].join('\n\n'),
    context: {
      userId: context.actorId,
      sessionId: context.correlationId ?? undefined,
      skipRAG: true,
    },
    maxTokens: 1800,
    temperature: 0.2,
  });
  return { message: result.content, provider: result.provider };
}

/**
 * Canonical execution entry point for an operational AI command.
 *
 * The command can only mutate the platform when it maps to a registered tool.
 * Unmapped commands are advisory-only and route through executeAiTask().
 */
export async function executeAICommand(
  command: string,
  context: AICommandExecutionContext,
): Promise<AICommandExecutionResult> {
  const plannedTool = planAIToolFromCommand(command, context.commandContext ?? {});

  if (plannedTool) {
    const tool = getAITool(plannedTool.name);
    const executionContext: AIToolExecutionContext = {
      ...context,
      confirmationText:
        context.approvalGranted && tool?.approvalRequired
          ? tool.confirmationPhrase ?? `CONFIRM ${tool.name.toUpperCase()}`
          : context.confirmationText,
    };
    const toolResult = await executeRegisteredAITool(plannedTool.name, plannedTool.input, executionContext);

    if (toolResult.status === 'approval_required') {
      return {
        ok: false,
        executed: false,
        status: 'approval_required',
        message: `Human approval is required before ${toolResult.tool} can execute.`,
        tool: toolResult.tool,
        risk: toolResult.risk,
        traceId: toolResult.traceId,
        requiredConfirmation: toolResult.requiredConfirmation,
      };
    }

    if (!toolResult.ok) {
      return {
        ok: false,
        executed: false,
        status: toolResult.status,
        message: toolResult.error ?? 'Tool execution failed.',
        tool: toolResult.tool,
        risk: toolResult.risk,
        payload: toolResult.payload,
        traceId: toolResult.traceId,
      };
    }

    if (toolResult.status === 'accepted') {
      return {
        ok: true,
        executed: true,
        status: 'running',
        message: `${context.agentLabel ?? context.agent} dispatched ${toolResult.tool}; external execution is still running.`,
        tool: toolResult.tool,
        risk: toolResult.risk,
        payload: toolResult.payload,
        traceId: toolResult.traceId,
      };
    }

    let message = `${context.agentLabel ?? context.agent} executed ${toolResult.tool}.`;
    let provider: string | undefined;
    if (toolResult.classification === 'read' && shouldSynthesize(command, toolResult.tool)) {
      try {
        const synthesis = await synthesizeReadResult(command, toolResult.tool, toolResult.payload, context);
        message = synthesis.message || message;
        provider = synthesis.provider;
      } catch (error) {
        logger.warn('[ai-command-executor] live-data synthesis failed', {
          tool: toolResult.tool,
          error: String(error),
        });
      }
    }

    return {
      ok: true,
      executed: true,
      status: 'completed',
      message,
      tool: toolResult.tool,
      risk: toolResult.risk,
      provider,
      payload: toolResult.payload,
      traceId: toolResult.traceId,
    };
  }

  const toolCatalog = getAIToolCatalogForPrompt(context.agent);
  const result = await executeAiTask({
    task: context.advisoryTask ?? 'general_chat',
    prompt: [
      `You are ${context.agentLabel ?? context.agent}, operating as ${context.agentRole ?? 'an authorized Elevate platform assistant'}.`,
      'You may explain, analyze, draft, or recommend.',
      'Do not claim a business action was executed unless a registered tool actually ran.',
      'Do not invent application status, funding approval, enrollment status, payment status, compliance outcomes, or current system state.',
      `Registered tools currently authorized for this agent:\n${toolCatalog || 'No tools assigned.'}`,
      `User command:\n${command}`,
    ].join('\n\n'),
    context: {
      userId: context.actorId,
      sessionId: context.correlationId ?? undefined,
    },
    maxTokens: 1400,
    temperature: 0.2,
  });

  return {
    ok: true,
    executed: false,
    status: 'advisory',
    message: result.content,
    provider: result.provider,
    traceId: context.correlationId ?? null,
  };
}
