import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { executeAiTask, type AITask } from '@/lib/ai/execute-ai-task';
import { aiReason } from '@/lib/ai/ai-service';
import {
  getAITool,
  getAIToolCatalogForPrompt,
  type AIAgentId,
} from '@/lib/ai/tools/registry';
import { executeRegisteredAITool } from '@/lib/ai/tools/executor';
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

type PlannedTool = { name: string; input: Record<string, unknown> };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function extractUuid(text: string): string | null {
  return text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i)?.[0] ?? null;
}

function extractNamedFilter(command: string, label: string): string | null {
  const match = command.match(new RegExp(`\\b${label}\\s+([a-z0-9_-]+)`, 'i'));
  return match?.[1]?.trim() || null;
}

function wioaFollowupInput(command: string, context: Record<string, unknown>): Record<string, unknown> {
  const input = { ...asRecord(context.toolInput) };
  const lower = command.toLowerCase();
  if (/30\s*[- ]?day/.test(lower)) input.type = '30-day';
  if (/\b(overdue|past due|missing|missed)\b/.test(lower)) input.overdue = true;
  const sector = extractNamedFilter(command, 'sector');
  const program = extractNamedFilter(command, 'program');
  if (sector) input.sector = sector;
  if (program) input.program = program;
  return input;
}

function planToolFromCommand(command: string, context: Record<string, unknown>): PlannedTool | null {
  const explicitTool = typeof context.toolName === 'string' ? context.toolName : null;
  if (explicitTool && getAITool(explicitTool)) {
    return { name: explicitTool, input: asRecord(context.toolInput) };
  }

  const lower = command.toLowerCase();
  const contextId = typeof context.id === 'string' ? context.id : null;
  const id = contextId ?? extractUuid(command);

  if (/\bwioa\b/.test(lower) && /\b(follow[- ]?ups?|30\s*[- ]?day|overdue|past due|missing|missed)\b/.test(lower)) {
    return { name: 'wioa.followups', input: wioaFollowupInput(command, context) };
  }
  if (/\bwioa\b/.test(lower) && /\b(performance|outcomes?|metrics?|narrative|report|earnings|credential|skill gain)\b/.test(lower)) {
    return { name: 'wioa.performance', input: asRecord(context.toolInput) };
  }
  if (/\bwioa\b/.test(lower) && /\b(list|show|find|search|participants?)\b/.test(lower)) {
    return { name: 'wioa.list', input: asRecord(context.toolInput) };
  }
  if (/\b(list|show|review|find|search)\b.*\bapplications?\b/.test(lower) || /\bpending applications?\b/.test(lower)) {
    return { name: 'applications.search', input: {} };
  }
  if (/\bapprove\b.*\bapplication\b/.test(lower)) {
    return { name: 'applications.approve', input: id ? { id } : {} };
  }
  if (/\b(list|show|find|search)\b.*\bstudents?\b/.test(lower)) {
    return { name: 'students.search', input: {} };
  }
  if (/\b(list|show|find|search)\b.*\benrollments?\b/.test(lower)) {
    return { name: 'enrollments.search', input: {} };
  }
  if (/\b(list|show|find)\b.*\bprograms?\b/.test(lower)) {
    return { name: 'programs.list', input: {} };
  }
  if (/\b(system|platform)\b.*\b(health|status)\b|\bhealth check\b/.test(lower)) {
    return { name: 'system.health', input: {} };
  }
  if (/\b(analytics|metrics|dashboard numbers)\b/.test(lower)) {
    return { name: 'analytics.read', input: {} };
  }
  if (/\bpayout\b.*\b(queue|pending|list|show)\b|\b(queue|pending|list|show)\b.*\bpayout/.test(lower)) {
    return { name: 'payouts.list', input: {} };
  }
  if (/\bmark\b.*\bpayout\b.*\bpaid\b/.test(lower)) {
    return { name: 'payouts.markPaid', input: id ? { enrollmentId: id } : {} };
  }
  if (/\b(generate|build|create)\b.*\bcourse\b/.test(lower)) {
    return { name: 'courses.generate', input: { ...asRecord(context.toolInput), prompt: command } };
  }
  if (/\brun\b.*\btests?\b/.test(lower)) {
    return { name: 'workflows.runTests', input: asRecord(context.toolInput) };
  }

  return null;
}

function confirmationFromRequest(command: string, body: Record<string, unknown>, toolName: string): unknown {
  if (typeof body.confirmationText === 'string') return body.confirmationText;
  const required = getAITool(toolName)?.confirmationPhrase;
  if (required && command.includes(required)) return required;
  return undefined;
}

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

async function synthesizeReadResult(params: {
  agentLabel: string;
  command: string;
  tool: string;
  payload: unknown;
}): Promise<{ message: string; provider?: string }> {
  const result = await aiReason({
    temperature: 0.2,
    maxTokens: 1800,
    messages: [
      {
        role: 'system',
        content: `You are ${params.agentLabel}, an Elevate workforce/admin AI. The data below came from an authenticated live platform tool. Answer only from that data. Do not invent missing records, eligibility, funding decisions, compliance conclusions, or contact information. If asked to draft an email/reminder, draft it but do not claim it was sent. If asked for a performance narrative, clearly label it as a draft for staff review.`,
      },
      {
        role: 'user',
        content: `Admin request:\n${params.command}\n\nLive tool: ${params.tool}\n\nLive result:\n${safeToolData(params.payload)}`,
      },
    ],
  });
  return { message: result.content, provider: result.provider };
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
  const plannedTool = planToolFromCommand(command, context);

  if (plannedTool) {
    const result = await executeRegisteredAITool(plannedTool.name, plannedTool.input, {
      agent: agentConfig.agent,
      actorId: auth.id,
      actorRoles: auth.effectiveRoles,
      tenantId: typeof context.tenantId === 'string' ? context.tenantId : null,
      correlationId,
      confirmationText: confirmationFromRequest(command, body, plannedTool.name),
      requestHeaders: req.headers,
      adminOrigin: req.nextUrl.origin,
      appOrigin: req.nextUrl.origin,
      idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null,
    });

    if (result.status === 'approval_required') {
      return NextResponse.json({
        success: false,
        executed: false,
        approvalRequired: true,
        requiredConfirmation: result.requiredConfirmation,
        agent: agentConfig.label,
        tool: result.tool,
        risk: result.risk,
        message: `Human approval is required. Type exactly: ${result.requiredConfirmation}`,
        traceId: result.traceId,
      }, { status: 409 });
    }

    if (!result.ok) {
      return NextResponse.json({
        success: false,
        executed: false,
        agent: agentConfig.label,
        tool: result.tool,
        risk: result.risk,
        message: result.error ?? 'Tool execution failed.',
        data: result.payload ?? null,
        traceId: result.traceId,
      }, { status: result.httpStatus >= 400 ? result.httpStatus : 500 });
    }

    let message = `${agentConfig.label} executed ${result.tool}.`;
    let provider: string | undefined;
    if (result.classification === 'read' && shouldSynthesize(command, result.tool)) {
      try {
        const synthesis = await synthesizeReadResult({
          agentLabel: agentConfig.label,
          command,
          tool: result.tool,
          payload: result.payload,
        });
        message = synthesis.message || message;
        provider = synthesis.provider;
      } catch (error) {
        logger.warn('[paris/execute] live-data synthesis failed; returning raw tool result', {
          tool: result.tool,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      executed: true,
      agent: agentConfig.label,
      tool: result.tool,
      risk: result.risk,
      message,
      provider,
      data: result.payload ?? null,
      traceId: result.traceId,
    });
  }

  try {
    const toolCatalog = getAIToolCatalogForPrompt(agentConfig.agent);
    const prompt = [
      `You are ${agentConfig.label}, operating as the ${agentConfig.role} specialist inside Elevate.`,
      'You may explain, analyze, draft, or recommend. Do not claim that a business action was executed unless a registered tool actually ran.',
      'Do not invent application status, funding approval, enrollment status, payment status, compliance outcomes, or current system state.',
      `Registered tools currently authorized for this agent:\n${toolCatalog || 'No tools assigned.'}`,
      `User command:\n${command}`,
    ].join('\n\n');

    const aiResult = await executeAiTask({
      task: agentConfig.task,
      prompt,
      context: {
        userId: auth.id,
        sessionId: typeof context.sessionId === 'string' ? context.sessionId : correlationId,
      },
      maxTokens: 1200,
      temperature: 0.2,
    });

    logger.info('[paris/execute] canonical AI guidance completed', {
      actorId: auth.id,
      agent: agentConfig.agent,
      agentType,
      provider: aiResult.provider,
      correlationId,
    });

    return NextResponse.json({
      success: true,
      executed: false,
      agent: agentConfig.label,
      message: aiResult.content,
      provider: aiResult.provider,
      availableTools: toolCatalog.split('\n').filter(Boolean),
      correlationId,
    });
  } catch (error) {
    logger.error('[paris/execute] canonical execution failed', error instanceof Error ? error : new Error(String(error)), {
      actorId: auth.id,
      agentType,
      correlationId,
    });
    return NextResponse.json({
      success: false,
      executed: false,
      message: 'The AI execution service could not complete this request.',
      correlationId,
    }, { status: 500 });
  }
}
