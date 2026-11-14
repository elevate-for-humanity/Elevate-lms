import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getSecret } from '@/lib/secrets';
import { getGoogleService, getGoogleServices } from '@/lib/google/runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type CheckResult = { label: string; ok: boolean; detail?: string; ms: number };

function line(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ line: text })}\n\n`);
}
function done(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

async function check(label: string, fn: () => Promise<string | undefined>): Promise<CheckResult> {
  const started = Date.now();
  try {
    const detail = await fn();
    return { label, ok: true, ...(detail ? { detail } : {}), ms: Date.now() - started };
  } catch (error) {
    return {
      label,
      ok: false,
      detail: error instanceof Error ? error.message.slice(0, 180) : 'Health check failed',
      ms: Date.now() - started,
    };
  }
}

function fmt(result: CheckResult): string {
  const icon = result.ok ? '✓' : '✗';
  return `${icon} ${result.label.padEnd(32, ' ')} ${String(result.ms).padStart(5, ' ')}ms${result.detail ? `  ${result.detail}` : ''}`;
}

async function resolveSecret(key: string): Promise<string | null> {
  try {
    const value = await getSecret(key);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;


  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => controller.enqueue(line(text));
      const results: CheckResult[] = [];

      write('Elevate platform smoke test');
      write(`Started ${new Date().toISOString()}`);
      write('');

      for (const service of getGoogleServices()) {
        results.push(await check(`${service.label} health`, async () => {
          const health = await getGoogleService(service);
          if (!health.healthy) throw new Error('Service identity, readiness, configuration or Supabase verification failed');
          return `Google runtime verified at ${health.commit}`;
        }));
        write(fmt(results.at(-1)!));
      }

      results.push(
        await check('OpenHands engineering', async () => {
          const apiKey = await resolveSecret('OPENHANDS_API_KEY');
          if (!apiKey) throw new Error('OpenHands authorization missing');
          return 'authorized credential configured';
        }),
      );
      write(fmt(results.at(-1)!));

      results.push(
        await check('Supabase database', async () => {
          const db = await requireAdminClient();
          const { count, error } = await db
            .from('programs')
            .select('id', { count: 'exact', head: true });
          if (error) throw error;
          return `${count ?? 0} programs`;
        }),
      );
      write(fmt(results.at(-1)!));

      results.push(
        await check('Supabase storage', async () => {
          const db = await requireAdminClient();
          const { data, error } = await db.storage.listBuckets();
          if (error) throw error;
          return `${data?.length ?? 0} buckets`;
        }),
      );
      write(fmt(results.at(-1)!));

      results.push(
        await check('AI provider credentials', async () => {
          const providers = await Promise.all([
            resolveSecret('OPENAI_API_KEY'),
            resolveSecret('GROQ_API_KEY'),
            resolveSecret('GEMINI_API_KEY'),
          ]);
          const configured = ['OpenAI', 'Groq', 'Gemini'].filter((_, index) =>
            Boolean(providers[index]),
          );
          if (!configured.length) throw new Error('No AI provider key configured');
          return configured.join(', ');
        }),
      );
      write(fmt(results.at(-1)!));

      results.push(
        await check('Stripe configuration', async () => {
          const [secret, webhook] = await Promise.all([
            resolveSecret('STRIPE_SECRET_KEY'),
            resolveSecret('STRIPE_WEBHOOK_SECRET'),
          ]);
          if (!secret) throw new Error('STRIPE_SECRET_KEY missing');
          return webhook ? 'secret + webhook configured' : 'secret configured; webhook missing';
        }),
      );
      write(fmt(results.at(-1)!));

      results.push(
        await check('Email configuration', async () => {
          const resend = await resolveSecret('RESEND_API_KEY');
          if (!resend) throw new Error('RESEND_API_KEY missing');
          return 'Resend configured';
        }),
      );
      write(fmt(results.at(-1)!));

      write('');
      const passed = results.filter((result) => result.ok).length;
      const failed = results.length - passed;
      write(`Result: ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
      controller.enqueue(done());
      controller.close();
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
