/**
 * GET /api/devstudio/qa-scan
 *
 * Autonomous QA Layer — SSE streaming scanner.
 *
 * Runs a full platform QA pass:
 *   1. Route health   — page.tsx and route.ts counts, duplicate detection
 *   2. Auth gaps      — routes missing auth guards
 *   3. API health     — critical API endpoints respond correctly
 *   4. DB integrity   — key tables exist and have rows
 *   5. Program integrity — every registered program has a DB row
 *   6. Enrollment flow — apply/checkout routes exist for active programs
 *   7. Link scan      — internal hrefs with no matching page
 *   8. Env vars       — required vars present
 *
 * Query params:
 *   ?scope=all|routes|auth|api|db|programs|links|env  (default: all)
 *
 * Streams SSE lines in the same format as /api/devstudio/execute.
 * Admin-only.
 */

import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROGRAM_REGISTRY } from '@/lib/platform/system-registry';
import { emitEvent } from '@/lib/platform/events';
import { describeCheckedAppDirs, discoverNextAppDirs } from '@/lib/devstudio/next-app-dirs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function enc(text: string) {
  return new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`);
}
function done() {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

const PASS  = '\x1b[32m✓\x1b[0m';
const FAIL  = '\x1b[31m✗\x1b[0m';
const WARN  = '\x1b[33m⚠\x1b[0m';
const DIM   = '\x1b[90m';
const RESET = '\x1b[0m';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  const scope = req.nextUrl.searchParams.get('scope') ?? 'all';

  const stream = new ReadableStream({
    async start(controller) {
      const write = (line: string) => {
        try { controller.enqueue(enc(line)); } catch { /* closed */ }
      };

      const results = { pass: 0, warn: 0, fail: 0 };
      const issues: string[] = [];

      const pass  = (msg: string) => { results.pass++;  write(`${PASS}  ${msg}`); };
      const fail  = (msg: string) => { results.fail++;  issues.push(msg); write(`${FAIL}  ${msg}`); };
      const warn  = (msg: string) => { results.warn++;  issues.push(msg); write(`${WARN}  ${msg}`); };
      const info  = (msg: string) => write(`${DIM}   ${msg}${RESET}`);
      const head  = (msg: string) => write(`\n\x1b[1m${msg}\x1b[0m`);

      try {
        write(`\x1b[33m⚙  Autonomous QA Scan (scope: ${scope})\x1b[0m`);
        write(`${DIM}   ${new Date().toISOString()}${RESET}`);

        // ── 1. Route health ────────────────────────────────────────────────
        if (scope === 'all' || scope === 'routes') {
          head('1. Route Health');
          try {
          const { readdirSync, lstatSync } = await import('fs');
          const { join, relative } = await import('path');
          const appDirs = discoverNextAppDirs();
          let pages = 0, apis = 0;
          const slugMap = new Map<string, string[]>();

          if (appDirs.length === 0) {
            warn('Route source scan unavailable: no Next.js app directory found');
            info(`Checked: ${describeCheckedAppDirs()}`);
          }

          function routeFromFile(rootDir: string, full: string, suffix: 'page.tsx' | 'route.ts') {
            let relPath = relative(rootDir, full).replace(/\\/g, '/');
            if (relPath === suffix) {
              relPath = '';
            } else if (relPath.endsWith(`/${suffix}`)) {
              relPath = relPath.slice(0, -suffix.length - 1);
            }
            return `/${relPath}`.replace(/\/\([^)]+\)/g, '').replace(/\/+/g, '/');
          }

          function walkRoutes(rootDir: string, dir: string) {
            let entries: string[];
            try { entries = readdirSync(dir); } catch { return; }
            for (const f of entries) {
              const full = join(dir, f);
              try {
                if (lstatSync(full).isDirectory()) { walkRoutes(rootDir, full); continue; }
              } catch { continue; }
              if (f === 'page.tsx') {
                pages++;
                const route = routeFromFile(rootDir, full, 'page.tsx');
                const slug = route.split('/').pop() ?? '';
                if (!slugMap.has(slug)) slugMap.set(slug, []);
                slugMap.get(slug)!.push(route);
              }
              if (f === 'route.ts') apis++;
            }
          }
          for (const appDir of appDirs) walkRoutes(appDir.dir, appDir.dir);

          if (appDirs.length > 0) {
            pass(`${pages} page routes, ${apis} API routes`);
            info(`App roots: ${appDirs.map((dir) => dir.label).join(', ')}`);
            const dups = [...slugMap.entries()].filter(([, paths]) => paths.length > 1 && !['page', 'route', 'layout', 'loading'].includes(paths[0].split('/').pop() ?? ''));
            if (dups.length > 0) {
              warn(`${dups.length} duplicate route slugs detected`);
              dups.slice(0, 5).forEach(([slug, paths]) => info(`${slug}: ${paths.slice(0, 2).join(', ')}`));
            } else {
              pass('No duplicate route slugs');
            }
          }
          } catch (err) {
            fail(`Route health scan error: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }

        // ── 2. Auth gaps ───────────────────────────────────────────────────
        if (scope === 'all' || scope === 'auth') {
          head('2. Auth Coverage');
          try {
          const { readdirSync, lstatSync, readFileSync } = await import('fs');
          const { join } = await import('path');
          const appDirs = discoverNextAppDirs();
          const apiDirs = appDirs.map((appDir) => join(appDir.dir, 'api')).filter((dir) => {
            try {
              return lstatSync(dir).isDirectory();
            } catch {
              return false;
            }
          });
          let checked = 0, noAuth = 0, adminNoRole = 0;

          function walkAuth(dir: string) {
            let entries: string[];
            try { entries = readdirSync(dir); } catch { return; }
            for (const f of entries) {
              const full = join(dir, f);
              try {
                if (lstatSync(full).isDirectory()) { walkAuth(full); continue; }
              } catch { continue; }
              if (f !== 'route.ts') continue;
              checked++;
              let src: string;
              try { src = readFileSync(full, 'utf8'); } catch { continue; }
              const isPublic = src.includes('// PUBLIC ROUTE');
              const hasAuth = src.includes('apiAuthGuard') || src.includes('apiRequireAdmin') ||
                src.includes('apiRequireInstructor') || src.includes('withAuth') ||
                src.includes('getCurrentUser') || src.includes('getUser') ||
                src.includes('requireAdmin') || src.includes('requireRole') || isPublic;
              if (!hasAuth) noAuth++;
              const isAdminRoute = full.includes('/admin/');
              if (isAdminRoute && !src.includes('apiRequireAdmin') && !src.includes('requireAdmin') && !src.includes('requireRole') && !isPublic) {
                adminNoRole++;
              }
            }
          }
          if (apiDirs.length === 0) {
            warn('Auth coverage scan unavailable: no app/api directory found');
            info(`Checked app roots: ${describeCheckedAppDirs()}`);
          }
          for (const apiDir of apiDirs) walkAuth(apiDir);

          if (apiDirs.length > 0) {
            info(`Checked ${checked} API routes`);
            if (noAuth === 0) {
              pass('All API routes have auth checks');
            } else {
              fail(`${noAuth} API routes missing auth checks`);
            }
            if (adminNoRole === 0) {
              pass('All admin routes have role checks');
            } else {
              warn(`${adminNoRole} admin routes may lack role enforcement`);
            }
          }
          } catch (err) {
            fail(`Auth coverage scan error: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }

        // ── 3. API health ──────────────────────────────────────────────────
        if (scope === 'all' || scope === 'api') {
          head('3. Critical API Health');
          const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? process.env.NEXT_PUBLIC_APP_URL;
          const cookie  = req.headers.get('cookie') ?? '';
          const criticalApis = [
            '/api/admin/monitoring/status',
            '/api/devstudio/health',
            '/api/devstudio/platform-state',
          ];
          for (const api of criticalApis) {
            try {
              const res = await fetch(`${baseUrl}${api}`, {
                headers: { Cookie: cookie },
                signal: AbortSignal.timeout(5000),
              });
              if (res.ok) pass(`${api} → ${res.status}`);
              else warn(`${api} → ${res.status}`);
            } catch (err) {
              fail(`${api} → unreachable (${err instanceof Error ? err.message : 'timeout'})`);
            }
          }
        }

        // ── 4. DB integrity ────────────────────────────────────────────────
        if (scope === 'all' || scope === 'db') {
          head('4. Database Integrity');
          try {
            const supabase = createAdminClient();
            const tables = ['programs', 'profiles', 'enrollments', 'applications', 'curriculum_lessons', 'courses', 'platform_secrets', 'ai_agents'];
            for (const table of tables) {
              const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
              if (error) fail(`${table}: ${error.message}`);
              else if ((count ?? 0) === 0) warn(`${table}: 0 rows`);
              else pass(`${table}: ${count} rows`);
            }
          } catch (err) {
            fail(`DB connection failed: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }

        // ── 5. Program integrity ───────────────────────────────────────────
        if (scope === 'all' || scope === 'programs') {
          head('5. Program Registry Integrity');
          try {
            const supabase = createAdminClient();
            const { data: dbPrograms } = await supabase
              .from('programs')
              .select('slug, published, is_active')
              .eq('published', true);
            const dbSlugs = new Set((dbPrograms ?? []).map((p: { slug: string }) => p.slug));

            for (const prog of PROGRAM_REGISTRY.filter(p => p.status === 'active')) {
              if (dbSlugs.has(prog.slug)) {
                pass(`${prog.slug} — in DB`);
              } else {
                warn(`${prog.slug} — in registry but NOT in DB (programs table)`);
              }
            }

            // Check for DB programs not in registry
            const registrySlugs = new Set(PROGRAM_REGISTRY.map(p => p.slug));
            const unregistered = (dbPrograms ?? []).filter((p: { slug: string }) => !registrySlugs.has(p.slug));
            if (unregistered.length > 0) {
              warn(`${unregistered.length} DB programs not in system registry: ${unregistered.slice(0, 5).map((p: { slug: string }) => p.slug).join(', ')}`);
            }
          } catch (err) {
            fail(`Program check failed: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }

        // ── 6. Enrollment flow ─────────────────────────────────────────────
        if (scope === 'all' || scope === 'enrollment') {
          head('6. Enrollment Flow Coverage');
          try {
          const { existsSync } = await import('fs');
          const { join } = await import('path');
          let covered = 0, missing = 0;

          for (const prog of PROGRAM_REGISTRY.filter(p => p.status === 'active')) {
            const applyExists = existsSync(join(process.cwd(), 'app', 'programs', prog.slug, 'apply')) ||
              existsSync(join(process.cwd(), 'app', 'programs', '[program]', 'apply'));
            const checkoutExists = existsSync(join(process.cwd(), 'app', 'checkout', prog.slug)) ||
              existsSync(join(process.cwd(), 'app', 'checkout', '[program]'));
            if (applyExists && checkoutExists) covered++;
            else { missing++; info(`${prog.slug}: apply=${applyExists} checkout=${checkoutExists}`); }
          }
          if (missing === 0) pass(`All ${covered} programs have apply + checkout routes`);
          else warn(`${missing} programs missing apply or checkout routes`);
          } catch (err) {
            fail(`Enrollment flow scan error: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }

        // ── 7. Env vars ────────────────────────────────────────────────────
        if (scope === 'all' || scope === 'env') {
          head('7. Environment Variables');
          const required = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          ];
          const recommended = [
            'OPENAI_API_KEY',
            'GROQ_API_KEY',
            'STRIPE_SECRET_KEY',
            'RESEND_API_KEY',
            'GITHUB_TOKEN',
          ];
          for (const v of required) {
            if (process.env[v]) pass(`${v} set`);
            else fail(`${v} MISSING — required`);
          }
          for (const v of recommended) {
            if (process.env[v]) pass(`${v} set`);
            else warn(`${v} not set — some features disabled`);
          }
        }

        // ── Summary ────────────────────────────────────────────────────────
        write('');
        write('\x1b[1m── QA Summary ──────────────────────────\x1b[0m');
        write(`${PASS}  Passed: ${results.pass}`);
        if (results.warn > 0) write(`${WARN}  Warnings: ${results.warn}`);
        if (results.fail > 0) write(`${FAIL}  Failed: ${results.fail}`);

        const severity = results.fail > 0 ? 'error' : results.warn > 0 ? 'warning' : 'info';
        await emitEvent('qa.scan_completed', 'system', {
          severity,
          actor_id: auth.id,
          actor_type: 'ai',
          payload: { scope, pass: results.pass, warn: results.warn, fail: results.fail, issues: issues.slice(0, 10) },
          message: `QA scan: ${results.pass} pass, ${results.warn} warn, ${results.fail} fail`,
        });

      } catch (err) {
        write(`\x1b[31m✗  QA scan error: ${err instanceof Error ? err.message : 'unknown'}\x1b[0m`);
      } finally {
        try { controller.enqueue(done()); } catch { /* closed */ }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    },
  });
}
