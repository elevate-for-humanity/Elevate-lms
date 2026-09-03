import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { aiChat } from '@/lib/ai/ai-service';
import { getAITool, getAIToolCatalogForPrompt, listAIToolsForAgent } from '@/lib/ai/tools/registry';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';
import { executeRegisteredAITool } from '@/lib/ai/tools/executor';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type PlannedCommand = {
  tool: string | null;
  input: Record<string, unknown>;
  explanation?: string;
  answer?: string;
};

function sseLine(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ line: text })}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function extractUuid(text: string): string | null {
  return text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i)?.[0] ?? null;
}
function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return asRecord(JSON.parse(cleaned));
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first < 0 || last <= first) return null;
    try {
      return asRecord(JSON.parse(cleaned.slice(first, last + 1)));
    } catch {
      return null;
    }
  }
}

function heuristicPlan(command: string): PlannedCommand | null {
  const lower = command.toLowerCase();
  const id = extractUuid(command);

  if (/health|system status|platform status/.test(lower)) return { tool: 'system.health', input: {} };
  if (/\b(list|show|review|find|search)\b.*\bapplications?\b/.test(lower)) return { tool: 'applications.search', input: {} };
  if (/\bapprove\b.*\bapplication\b/.test(lower)) return { tool: 'applications.approve', input: id ? { id } : {} };
  if (/\b(list|show|find|search)\b.*\bstudents?\b/.test(lower)) return { tool: 'students.search', input: {} };
  if (/\b(list|show|find|search)\b.*\benrollments?\b/.test(lower)) return { tool: 'enrollments.search', input: {} };
  if (/\b(list|show|find)\b.*\bprograms?\b/.test(lower)) return { tool: 'programs.list', input: {} };
  if (/\banalytics|metrics\b/.test(lower)) return { tool: 'analytics.read', input: {} };
  if (/\bpayout\b.*\b(queue|pending|list|show)\b|\b(queue|pending|list|show)\b.*\bpayout/.test(lower)) return { tool: 'payouts.list', input: {} };
  if (/\bmark\b.*\bpayout\b.*\bpaid\b/.test(lower)) return { tool: 'payouts.markPaid', input: id ? { enrollmentId: id } : {} };
  if (/\b(generate|build|create|finish|complete|resume)\b.*\bcourse\b/.test(lower)) {
    return {
      tool: 'courses.generate',
      input: { action: 'start', goal: command, ...(id ? { courseId: id } : {}) },
    };
  }
  if (/\brun\b.*\btests?\b/.test(lower)) return { tool: 'workflows.runTests', input: {} };
  if (/\bdeploy\b/.test(lower)) return { tool: 'deployments.autopilot', input: {} };
  if (/\bapply\b.*\ball\b.*\bmigrations?\b/.test(lower)) return { tool: 'migrations.applyAll', input: {} };
  if (/\brollback\b.*\bmigration/.test(lower)) return { tool: 'migrations.rollback', input: {} };
  if (/\brun\b.*\bmigration/.test(lower)) return { tool: 'migrations.run', input: {} };
  if (/\bgit\b.*\bpush\b|\bpush\b.*\bbranch\b/.test(lower)) return { tool: 'devstudio.gitPush', input: {} };
  return null;
}

async function classifyCommand(command: string): Promise<PlannedCommand> {
  const deterministic = planAIToolFromCommand(command);
  if (deterministic) return { tool: deterministic.name, input: deterministic.input };

  const heuristic = heuristicPlan(command);
  if (heuristic) return heuristic;

  const toolCatalog = getAIToolCatalogForPrompt('LIZZY');
  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: `You are the Elevate Dev Studio command router. Choose one registered tool only when the user's request clearly maps to that tool. Never invent IDs or tool names. If no tool should execute, return tool:null and a concise answer. Return JSON only: {"tool":"name-or-null","input":{},"explanation":"short","answer":"optional"}.\n\nRegistered tools:\n${toolCatalog}`,
      },
      { role: 'user', content: command },
    ],
    temperature: 0,
    maxTokens: 700,
  });

  const parsed = extractJsonObject(result.content);
  const tool = typeof parsed?.tool === 'string' && getAITool(parsed.tool) ? parsed.tool : null;
  return {
    tool,
    input: asRecord(parsed?.input),
    explanation: typeof parsed?.explanation === 'string' ? parsed.explanation : undefined,
    answer: typeof parsed?.answer === 'string' ? parsed.answer : tool ? undefined : result.content,
  };
}

function redactSecrets(value: string): string {
  return value
    .replace(/\bsk_(?:live|test)_[A-Za-z0-9_*.-]+/gi, '[REDACTED STRIPE KEY]')
    .replace(/\bSG\.[A-Za-z0-9_.-]+/g, '[REDACTED SENDGRID KEY]')
    .replace(/\bBearer\s+[A-Za-z0-9_.-]+/gi, 'Bearer [REDACTED]');
}

function summarizePayload(toolName: string, payload: unknown): string {
  if (payload == null) return 'Completed with no response body.';
  if (typeof payload === 'string') return redactSecrets(payload.slice(0, 2200));

  const record = asRecord(payload);
  if (toolName === 'system.health') {
    const services = asRecord(record.services);
    const lines = Object.values(services).map((value) => {
      const service = asRecord(value);
      const name = String(service.name ?? 'Service');
      const status = String(service.status ?? 'unknown');
      const message = typeof service.message === 'string' ? ` — ${redactSecrets(service.message)}` : '';
      return `• ${name}: ${status}${message}`;
    });
    return [`Overall platform status: ${String(record.overall ?? 'unknown')}`, ...lines].join('\n');
  }

  if (toolName === 'organization.directory') {
    const members = Array.isArray(record.members) ? record.members : [];
    if (!members.length) return 'No matching active team member was found in the approved organization directory.';
    return members.map((value) => {
      const member = asRecord(value);
      const summary = [member.name, member.title].filter(Boolean).join(' — ');
      return member.bio ? `${summary}\n${String(member.bio)}` : summary;
    }).join('\n\n');
  }

  const protectedTools: Record<string, string> = {
    'students.search': 'Student records were found. Open the protected Students workspace to review authorized details.',
    'enrollments.search': 'Enrollment records were found. Open the protected Enrollments workspace to review authorized details.',
    'applications.search': 'Application records were found. Open the protected Applications workspace to review authorized details.',
    'payouts.list': 'Payout records were found. Open the protected payout queue to review authorized details.',
    'wioa.list': 'WIOA records were found. Open the protected WIOA workspace to review authorized details.',
    'workflows.inspect': 'Workflow state was inspected. Open AI Task Queue or Workflow Designer for the complete protected audit record.',
  };
  if (protectedTools[toolName]) return protectedTools[toolName];

  try {
    const json = redactSecrets(JSON.stringify(payload, null, 2));
    return json.length > 2200 ? `${json.slice(0, 2200)}\n…` : json;
  } catch {
    return 'Completed.';
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = asRecord(await request.json().catch(() => ({})));
  const command = typeof body.command === 'string' ? body.command.trim() : '';
  if (!command) return Response.json({ error: 'command is required' }, { status: 400 });

  try {
    await hydrateProcessEnv();
  } catch (error) {
    logger.warn('[devstudio/execute] secret hydration failed; continuing with process environment', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => controller.enqueue(sseLine(text));
      try {
        write(`Command: ${command}`);
        const plan = await classifyCommand(command);

        if (!plan.tool) {
          write('Mode: analysis only — no tool executed.');
          if (plan.answer) {
            write(plan.answer);
          } else {
            const answer = await aiChat({
              messages: [
                {
                  role: 'system',
                  content: `You are LIZZY, the Elevate Dev Studio operations assistant. Answer concisely. Do not claim an action ran. Available registered tools:\n${getAIToolCatalogForPrompt('LIZZY')}`,
                },
                { role: 'user', content: command },
              ],
              temperature: 0.2,
              maxTokens: 1000,
            });
            write(answer.content || 'No answer was returned.');
          }
        } else {
          const tool = getAITool(plan.tool)!;
          write(`Tool: ${tool.name} · ${tool.classification} · risk ${tool.risk}${plan.explanation ? ` — ${plan.explanation}` : ''}`);

          const required = tool.confirmationPhrase;
          const confirmationText = typeof body.confirmationText === 'string'
            ? body.confirmationText
            : required && command.includes(required)
              ? required
              : undefined;

          const result = await executeRegisteredAITool(tool.name, {
            ...plan.input,
            ...asRecord(body.toolInput),
          }, {
            agent: 'LIZZY',
            actorId: auth.id,
            actorRoles: auth.effectiveRoles,
            tenantId: typeof body.tenantId === 'string' ? body.tenantId : null,
            correlationId,
            confirmationText,
            requestHeaders: request.headers,
            adminOrigin: getAdminUrl(),
            appOrigin: request.nextUrl.origin,
            idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null,
          });

          if (result.status === 'approval_required') {
            write(`Blocked pending human approval. Type exactly: "${result.requiredConfirmation}"`);
          } else if (!result.ok) {
            write(`Failed · HTTP ${result.httpStatus} · Tool execution failed.`);
          } else {
            write(`Completed · ${result.tool} · HTTP ${result.httpStatus}`);
            write(summarizePayload(result.tool, result.payload));
          }
        }
      } catch (error) {
        logger.error('[devstudio/execute] command failed', error instanceof Error ? error : undefined, {
          command,
          correlationId,
        });
        write('Failed: command execution failed. Check the operation logs for details.');
      } finally {
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  return Response.json({
    agent: 'LIZZY',
    tools: listAIToolsForAgent('LIZZY').map((tool) => ({
      name: tool.name,
      description: tool.description,
      classification: tool.classification,
      risk: tool.risk,
      approvalRequired: tool.approvalRequired,
    })),
  });
}
