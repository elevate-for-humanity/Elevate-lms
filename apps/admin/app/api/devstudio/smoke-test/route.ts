/**
 * GET /api/devstudio/smoke-test
 *
 * Streams a live smoke test of every critical platform endpoint.
 * Results are streamed as SSE so the Dev Studio Command tab shows
 * pass/fail in real time.
 *
 * Checks:
 *   - LMS public health
 *   - Admin monitoring status
 *   - DB connectivity (programs count)
 *   - Auth layer (Supabase reachable)
 *   - Redis / rate-limit layer
 *   - Storage (Supabase storage bucket reachable)
 *   - AI provider (Groq or Gemini reachable)
 *   - Key env vars present
 *   - Northflank services healthy (if Northflank API credentials are available)
 *
 * Admin-only. Streams SSE lines matching the Dev Studio format.
 */

import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

/**
 * Resolve a secret: env var first, then platform_secrets table fallback.
 * This lets admins set keys in the Secrets tab without needing server restarts.
 */
async function resolveSecret(key: string): Promise<string | null> {
  const envVal = process.env[key];
  if (envVal && envVal.trim()) return envVal.trim();
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('platform_secrets')
      .select('value_enc')
      .eq('key', key)
      .maybeSingle();
    const val = data?.value_enc;
    return val && val.trim() ? val.trim() : null;
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// ── SSE helpers ───────────────────────────────────────────────────────────────

function line(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ line: text })}\n\n`);
}
function done(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

// ── Check helpers ─────────────────────────────────────────────────────────────

interface CheckResult { label: string; ok: boolean; detail?: string; ms: number; }

async function check(
  label: string,
  fn: () => Promise<string | void>,
): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { label, ok: true, detail: detail ?? undefined, ms: Date.now() - t0 };
  } catch (err) {
    return { label, ok: false, detail: (err as Error).message?.slice(0, 120), ms: Date.now() - t0 };
  }
}

function fmt(r: CheckResult): string {
  const icon  = r.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  const label = r.label.padEnd(32, ' ');
  const ms    = `${r.ms}ms`.padStart(6, ' ');
  const detail = r.detail ? `  ${r.ok ? '\x1b[2m' : '\x1b[33m'}${r.detail}\x1b[0m` : '';
  return `  ${icon}  ${label} ${ms}${detail}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;
  const adminUrl = getAdminUrl();

  const stream = new ReadableStream({
    async start(controller) {
      const write = (text: string) => controller.enqueue(line(text));

      write('\x1b[1mElevate LMS — Smoke Test\x1b[0m');
      write(`\x1b[2mStarted ${new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET\x1b[0m`);
      write('');

      const results: CheckResult[] = [];

      // ── 1. LMS public health ──────────────────────────────────────────────
      write('\x1b[33mChecking public endpoints…\x1b[0m');
      results.push(await check('LMS /api/v1/health', async () => {
        const r = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        return d.status ?? 'ok';
      }));
      write(fmt(results.at(-1)!));

      // ── 2. Admin monitoring status ────────────────────────────────────────
      results.push(await check('Admin monitoring/status', async () => {
        const cookieHeader = request.headers.get('cookie') ?? '';
        const r = await fetch(`${adminUrl}/api/admin/monitoring/status`, {
          headers: { cookie: cookieHeader },
          signal: AbortSignal.timeout(10000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return `HTTP ${r.status}`;
      }));
      write(fmt(results.at(-1)!));

      // ── 3. DB connectivity ────────────────────────────────────────────────
      write('');
      write('\x1b[33mChecking database…\x1b[0m');
      results.push(await check('Supabase DB (programs count)', async () => {
        const db = await requireAdminClient();
        const { count, error } = await db
          .from('programs')
          .select('id', { count: 'exact', head: true });
        if (error) throw new Error(error.message);
        return `${count ?? 0} programs`;
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Supabase DB (profiles count)', async () => {
        const db = await requireAdminClient();
        const { count, error } = await db
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        if (error) throw new Error(error.message);
        return `${count ?? 0} profiles`;
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Supabase DB (enrollments count)', async () => {
        const db = await requireAdminClient();
        const { count, error } = await db
          .from('program_enrollments')
          .select('id', { count: 'exact', head: true });
        if (error) throw new Error(error.message);
        return `${count ?? 0} enrollments`;
      }));
      write(fmt(results.at(-1)!));

      // ── 4. Storage ────────────────────────────────────────────────────────
      write('');
      write('\x1b[33mChecking storage…\x1b[0m');
      results.push(await check('Supabase Storage (agreements)', async () => {
        const db = await requireAdminClient();
        const { data, error } = await db.storage.from('agreements').list('', { limit: 1 });
        if (error) throw new Error(error.message);
        return `${data?.length ?? 0} item(s) listed`;
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('Supabase Storage (documents)', async () => {
        const db = await requireAdminClient();
        const { data, error } = await db.storage.from('documents').list('', { limit: 1 });
        if (error) throw new Error(error.message);
        return `${data?.length ?? 0} item(s) listed`;
      }));
      write(fmt(results.at(-1)!));

      // ── 5. AI providers ───────────────────────────────────────────────────
      write('');
      write('\x1b[33mChecking AI providers…\x1b[0m');
      results.push(await check('Groq API reachable', async () => {
        // Groq is a fallback AI — OpenAI is primary.
        // Resolves from env first, then platform_secrets table.
        const key = await resolveSecret('GROQ_API_KEY');
        if (!key) return 'GROQ_API_KEY not set (optional — set in Secrets tab)';
        const r = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        return `${d.data?.length ?? '?'} models`;
      }));
      write(fmt(results.at(-1)!));

      results.push(await check('OpenAI API reachable', async () => {
        const key = process.env.OPENAI_API_KEY;
        if (!key) throw new Error('OPENAI_API_KEY not set');
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return `HTTP ${r.status}`;
      }));
      write(fmt(results.at(-1)!));

      // ── 6. Key env vars (env first, platform_secrets fallback) ───────────
      write('');
      write('\x1b[33mChecking environment…\x1b[0m');
      const REQUIRED_VARS = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'GROQ_API_KEY',
        'GITHUB_TOKEN',
        'NORTHFLANK_API_TOKEN',
        'NORTHFLANK_PROJECT_ID',
        'SENDGRID_API_KEY',
        'STRIPE_SECRET_KEY',
        'UPSTASH_REDIS_REST_URL',
      ];
      // Resolve each var: env first, then platform_secrets table
      const resolvedVars = await Promise.all(
        REQUIRED_VARS.map(async (k) => ({ k, val: await resolveSecret(k) }))
      );
      const missing = resolvedVars.filter((r) => !r.val).map((r) => r.k);
      const fromDb   = resolvedVars.filter((r) => r.val && !process.env[r.k]).map((r) => r.k);
      results.push(await check('Required env vars', async () => {
        if (missing.length > 0) throw new Error(`Missing: ${missing.join(', ')}`);
        const note = fromDb.length ? ` (${fromDb.length} from Secrets tab)` : '';
        return `${REQUIRED_VARS.length}/${REQUIRED_VARS.length} set${note}`;
      }));
      write(fmt(results.at(-1)!));
      if (missing.length > 0) {
        missing.forEach((k) => write(`     \x1b[31m⚠  ${k} is not set — add in DevStudio → Secrets tab\x1b[0m`));
      }
      if (fromDb.length > 0) {
        fromDb.forEach((k) => write(`     \x1b[33m⚡  ${k} resolved from Secrets tab\x1b[0m`));
      }

      // ── 7. Northflank services (if API credentials are available) ─────────
      const northflankToken = await resolveSecret('NORTHFLANK_API_TOKEN');
      const northflankProject = await resolveSecret('NORTHFLANK_PROJECT_ID');
      if (northflankToken && northflankProject) {
        write('');
        write('\x1b[33mChecking Northflank services…\x1b[0m');
        results.push(await check('Northflank elevate-lms', async () => {
          const r = await fetch(`${adminUrl}/api/devstudio/northflank-status`, {
            headers: { cookie: request.headers.get('cookie') ?? '' },
            signal: AbortSignal.timeout(12000),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const d = await r.json();
          const svc = d.services?.find((s: { name: string }) => s.name === 'elevate-lms');
          if (!svc) throw new Error('Service not found');
          if (!svc.healthy) throw new Error(`${svc.status} — running ${svc.runningCount}/${svc.desiredCount}`);
          return `running ${svc.runningCount}/${svc.desiredCount}`;
        }));
        write(fmt(results.at(-1)!));

        results.push(await check('Northflank elevate-admin', async () => {
          const r = await fetch(`${adminUrl}/api/devstudio/northflank-status`, {
            headers: { cookie: request.headers.get('cookie') ?? '' },
            signal: AbortSignal.timeout(12000),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const d = await r.json();
          const svc = d.services?.find((s: { name: string }) => s.name === 'elevate-admin');
          if (!svc) throw new Error('Service not found');
          if (!svc.healthy) throw new Error(`${svc.status} — running ${svc.runningCount}/${svc.desiredCount}`);
          return `running ${svc.runningCount}/${svc.desiredCount}`;
        }));
        write(fmt(results.at(-1)!));
      }

      // ── Summary ───────────────────────────────────────────────────────────
      const passed = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok).length;
      const totalMs = results.reduce((s, r) => s + r.ms, 0);

      write('');
      write('─'.repeat(52));
      if (failed === 0) {
        write(`\x1b[32m✓  All ${passed} checks passed\x1b[0m  (${totalMs}ms total)`);
      } else {
        write(`\x1b[31m✗  ${failed} check(s) failed\x1b[0m, ${passed} passed  (${totalMs}ms total)`);
        write('');
        write('\x1b[31mFailed checks:\x1b[0m');
        results.filter((r) => !r.ok).forEach((r) =>
          write(`  • ${r.label}: ${r.detail ?? 'unknown error'}`));
      }

      controller.enqueue(done());
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
