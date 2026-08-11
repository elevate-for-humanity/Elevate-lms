import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { aiChat } from '@/lib/ai/ai-service';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import { requireTypedConfirmation, getConfirmationPhrase } from '@/lib/security/require-confirmation';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type CommandAction = {
  name: string;
  args: Record<string, unknown>;
  explanation?: string;
};

type ActionTarget = {
  method: 'GET' | 'POST';
  path: string | ((args: Record<string, unknown>) => string);
  body?: (args: Record<string, unknown>) => Record<string, unknown>;
};

const ACTIONS: Record<string, ActionTarget> = {
  generate_course: { method: 'POST', path: '/api/admin/courses/generate', body: (args) => args },
  generate_video: { method: 'POST', path: '/api/video/generate', body: (args) => args },
  run_report: { method: 'GET', path: (args) => `/api/admin/reports/${encodeURIComponent(String(args.type ?? 'overview'))}` },
  get_analytics: { method: 'GET', path: '/api/admin/analytics' },
  list_applications: { method: 'GET', path: '/api/admin/applications' },
  approve_application: { method: 'POST', path: (args) => `/api/admin/applications/${encodeURIComponent(String(args.id ?? ''))}/approve`, body: (args) => args },
  list_students: { method: 'GET', path: '/api/admin/students' },
  list_enrollments: { method: 'GET', path: '/api/admin/enrollments' },
  enroll_student: { method: 'POST', path: '/api/admin/enrollments', body: (args) => args },
  issue_certificate: { method: 'POST', path: '/api/admin/certificates/bulk', body: (args) => args },
  list_cohorts: { method: 'GET', path: '/api/admin/cohorts' },
  list_wioa: { method: 'GET', path: '/api/admin/wioa' },
  run_export: { method: 'GET', path: (args) => `/api/admin/export/${encodeURIComponent(String(args.type ?? 'participants'))}` },
  list_programs: { method: 'GET', path: '/api/admin/programs' },
  flag_at_risk: { method: 'POST', path: '/api/admin/at-risk/flag', body: (args) => args },
  send_reminder: { method: 'POST', path: '/api/admin/send-reminder', body: (args) => args },
  list_payout_queue: { method: 'GET', path: '/api/admin/enrollments/payout-queue' },
  mark_payout_paid: { method: 'POST', path: '/api/admin/enrollments/mark-payout-paid', body: (args) => args },
  send_document_for_sign: { method: 'POST', path: '/api/admin/sign-documents/send', body: (args) => args },
  send_test_email: { method: 'POST', path: '/api/admin/test-email', body: (args) => args },
  check_system_health: { method: 'GET', path: '/api/admin/platform-health' },
  build_courses: { method: 'POST', path: '/api/autopilots/build-courses', body: (args) => args },
  deploy_autopilot: { method: 'POST', path: '/api/autopilots/deploy', body: (args) => args },
  run_tests: { method: 'POST', path: '/api/autopilots/run-tests', body: (args) => args },
  manage_app_trial: { method: 'POST', path: '/api/apps/trial/start', body: (args) => args },
  run_migration: { method: 'POST', path: '/api/admin/migrations/run', body: (args) => args },
  apply_all_pending_migrations: { method: 'POST', path: '/api/admin/migrations/apply-all', body: (args) => args },
  rollback: { method: 'POST', path: '/api/admin/migrations/rollback', body: (args) => args },
  send_bulk_email: { method: 'POST', path: '/api/admin/email/bulk', body: (args) => args },
  git_push: { method: 'POST', path: '/api/devstudio/git/push', body: (args) => args },
};

const ALLOWED_ACTIONS = [...Object.keys(ACTIONS), 'ask_question'] as const;

function sseLine(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ line: text })}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const direct = JSON.parse(cleaned);
    return asRecord(direct);
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

function heuristicAction(command: string): CommandAction | null {
  const lower = command.toLowerCase();
  if (/health|system status|platform status/.test(lower)) return { name: 'check_system_health', args: {} };
  if (/list|show/.test(lower) && /application/.test(lower)) return { name: 'list_applications', args: {} };
  if (/list|show/.test(lower) && /student/.test(lower)) return { name: 'list_students', args: {} };
  if (/list|show/.test(lower) && /enrollment/.test(lower)) return { name: 'list_enrollments', args: {} };
  if (/list|show/.test(lower) && /program/.test(lower)) return { name: 'list_programs', args: {} };
  if (/payout/.test(lower) && /queue|pending|list/.test(lower)) return { name: 'list_payout_queue', args: {} };
  if (/run.*test|test.*platform/.test(lower)) return { name: 'run_tests', args: {} };
  return null;
}

async function classifyCommand(command: string): Promise<CommandAction> {
  const heuristic = heuristicAction(command);
  if (heuristic) return heuristic;

  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: `You route an authenticated Elevate Dev Studio command to exactly one action. Allowed actions: ${ALLOWED_ACTIONS.join(', ')}. Return JSON only with shape {"name":"action","args":{},"explanation":"short"}. If the request is informational and should not mutate or query a dedicated endpoint, use ask_question and put a concise answer in args.answer. Never invent identifiers.`,
      },
      { role: 'user', content: command },
    ],
    temperature: 0,
    maxTokens: 700,
  });

  const parsed = extractJsonObject(result.content);
  const name = typeof parsed?.name === 'string' ? parsed.name : 'ask_question';
  const args = asRecord(parsed?.args);
  const explanation = typeof parsed?.explanation === 'string' ? parsed.explanation : undefined;
  if (!ALLOWED_ACTIONS.includes(name as (typeof ALLOWED_ACTIONS)[number])) {
    return { name: 'ask_question', args: { answer: result.content }, explanation: 'No supported action matched.' };
  }
  return { name, args, explanation };
}

function summarizePayload(payload: unknown): string {
  if (payload == null) return 'Completed with no response body.';
  if (typeof payload === 'string') return payload.slice(0, 1800);
  try {
    const json = JSON.stringify(payload, null, 2);
    return json.length > 1800 ? `${json.slice(0, 1800)}\n…` : json;
  } catch {
    return 'Completed.';
  }
}

async function executeAction(
  request: NextRequest,
  action: CommandAction,
  confirmationInput: unknown,
): Promise<{ ok: boolean; status: number; payload: unknown; url?: string }> {
  const target = ACTIONS[action.name];
  if (!target) return { ok: false, status: 400, payload: { error: `Unsupported action: ${action.name}` } };

  const requiredPhrase = getConfirmationPhrase(action.name);
  if (requiredPhrase) {
    const confirmation = requireTypedConfirmation(confirmationInput, action.name);
    if (!confirmation.ok) {
      return {
        ok: false,
        status: 409,
        payload: {
          error: 'Typed confirmation required',
          required: confirmation.required,
        },
      };
    }
  }

  const path = typeof target.path === 'function' ? target.path(action.args) : target.path;
  if (!path || path.includes('/undefined')) {
    return { ok: false, status: 400, payload: { error: 'Required action identifier is missing.' } };
  }

  const adminOrigin = getAdminUrl().replace(/\/$/, '');
  const origin = path.startsWith('/api/admin/') ? adminOrigin : request.nextUrl.origin;
  const url = `${origin}${path}`;
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  const authorization = request.headers.get('authorization');
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);
  headers.set('accept', 'application/json');

  const init: RequestInit = { method: target.method, headers, signal: AbortSignal.timeout(90_000) };
  if (target.method === 'POST') {
    headers.set('content-type', 'application/json');
    init.body = JSON.stringify(target.body ? target.body(action.args) : action.args);
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    : await response.text().catch(() => '');
  return { ok: response.ok, status: response.status, payload, url };
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => controller.enqueue(sseLine(text));
      try {
        write(`Command: ${command}`);
        const action = await classifyCommand(command);
        write(`Action: ${action.name}${action.explanation ? ` — ${action.explanation}` : ''}`);

        if (action.name === 'ask_question') {
          const supplied = typeof action.args.answer === 'string' ? action.args.answer : '';
          if (supplied) {
            write(supplied);
          } else {
            const answer = await aiChat({
              messages: [
                { role: 'system', content: 'You are Ellie, the Elevate platform operations assistant. Answer from the user request only and do not claim an operation ran unless an endpoint was executed.' },
                { role: 'user', content: command },
              ],
              temperature: 0.2,
              maxTokens: 1000,
            });
            write(answer.content || 'No answer was returned.');
          }
        } else {
          const requiredPhrase = getConfirmationPhrase(action.name);
          const confirmationInput = typeof body.confirmationText === 'string'
            ? body.confirmationText
            : requiredPhrase && command.includes(requiredPhrase)
              ? requiredPhrase
              : undefined;

          if (requiredPhrase && confirmationInput !== requiredPhrase) {
            write(`Blocked: type exactly "${requiredPhrase}" with the command to authorize this action.`);
          } else {
            write('Executing…');
            const result = await executeAction(request, action, confirmationInput);
            write(`${result.ok ? 'Completed' : 'Failed'} · HTTP ${result.status}${result.url ? ` · ${result.url}` : ''}`);
            write(summarizePayload(result.payload));
          }
        }
      } catch (error) {
        logger.error('[devstudio/execute] command failed', error instanceof Error ? error : undefined, { command });
        write(`Failed: ${error instanceof Error ? error.message : 'Unknown command error'}`);
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
