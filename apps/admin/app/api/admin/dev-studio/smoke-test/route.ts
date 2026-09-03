import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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
  const envValue = process.env[key]?.trim();
  if (envValue) return envValue;
  try {
    const db = await requireAdminClient();
    const { data } = await db.from('platform_secrets').select('value_enc').eq('key', key).maybeSingle();
    return data?.value_enc?.trim() || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;
  const adminUrl = getAdminUrl();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => controller.enqueue(line(text));
      const results: CheckResult[] = [];

      write('Elevate platform smoke test');
      write(`Started ${new Date().toISOString()}`);
      write('');

      results.push(await check('Marketing health', async () => {
        const response = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json().catch(() => ({}));
        return typeof payload?.status === 'string' ? payload.status : 'reachable';
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Admin health', async () => {
        const response = await fetch(`${adminUrl}/api/health`, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return 'reachable';
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Supabase database', async () => {
        const db = await requireAdminClient();
        const { count, error } = await db.from('programs').select('id', { count: 'exact', head: true });
        if (error) throw error;
        return `${count ?? 0} programs`;
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Supabase storage', async () => {
        const db = await requireAdminClient();
        const { data, error } = await db.storage.listBuckets();
        if (error) throw error;
        return `${data?.length ?? 0} buckets`;
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('AI provider credentials', async () => {
        const providers = await Promise.all([
          resolveSecret('OPENAI_API_KEY'),
          resolveSecret('GROQ_API_KEY'),
          resolveSecret('GEMINI_API_KEY'),
        ]);
        const configured = ['OpenAI', 'Groq', 'Gemini'].filter((_, index) => Boolean(providers[index]));
        if (!configured.length) throw new Error('No AI provider key configured');
        return configured.join(', ');
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Stripe configuration', async () => {
        const [secret, webhook] = await Promise.all([
          resolveSecret('STRIPE_SECRET_KEY'),
          resolveSecret('STRIPE_WEBHOOK_SECRET'),
        ]);
        if (!secret) throw new Error('STRIPE_SECRET_KEY missing');
        return webhook ? 'secret + webhook configured' : 'secret configured; webhook missing';
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Email configuration', async () => {
        const resend = await resolveSecret('RESEND_API_KEY');
        if (!resend) throw new Error('RESEND_API_KEY missing');
        return 'Resend configured';
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Northflank configuration', async () => {
        const token = await resolveSecret('NORTHFLANK_API_TOKEN');
        if (!token) return 'token not configured; VCS deploy checks only';
        return 'API token configured';
      }));
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
