import { getPublicRuntimeService } from './public-runtime-service';

export type RuntimeReadiness = {
  ready: boolean;
  missing: string[];
  commit: string;
  buildId: string;
  builtAt: string;
  revision: string | null;
};

export type DependencyHealth = {
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error?: string;
  checks?: { auth: DependencyHealth; database: DependencyHealth };
};

const REQUIRED_RUNTIME_CONFIG = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

function normalized(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function getRuntimeReadiness(
  additionalRequired: readonly string[] = [],
): RuntimeReadiness {
  const required = [...REQUIRED_RUNTIME_CONFIG, ...additionalRequired];
  const missing = required.filter((name) => !normalized(process.env[name]));
  const commit = normalized(
    [process.env.GIT_SHA, process.env.GITHUB_SHA, process.env.NEXT_PUBLIC_GIT_SHA].find(value => normalized(value)),
  );
  const buildId = normalized(process.env.NEXT_PUBLIC_BUILD_ID);
  const builtAt = normalized(process.env.BUILD_TIMESTAMP);

  if (!/^[a-f0-9]{40}$/i.test(commit)) missing.push('BUILD_COMMIT');

  return {
    ready: missing.length === 0,
    missing: [...new Set(missing)],
    commit: commit || 'unknown',
    buildId: buildId || 'unknown',
    builtAt: builtAt || 'unknown',
    revision: normalized(process.env.K_REVISION) || null,
  };
}

export async function checkSupabaseHealth(timeoutMs = 2500, request: typeof fetch = fetch): Promise<DependencyHealth> {
  const url = normalized(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/, '');
  const anonKey = normalized(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const started = Date.now();
  if (!url || !anonKey) return { ok: false, status: null, latencyMs: 0, error: 'missing_configuration' };

  async function probe(path: string): Promise<DependencyHealth> {
    const began = Date.now();
    try {
      const response = await request(url + path, {
        method: 'GET', headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      });
      // The database probe must return a PostgREST row array. Never expose rows.
      const valid = path.startsWith('/rest/') ? Array.isArray(await response.json()) : true;
      return { ok: response.ok && valid, status: response.status, latencyMs: Date.now() - began,
        ...(!response.ok ? { error: 'non_success_status' } : !valid ? { error: 'invalid_response' } : {}) };
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      return { ok: false, status: null, latencyMs: Date.now() - began,
        error: ['TimeoutError', 'AbortError', 'TypeError', 'SyntaxError'].includes(name) ? name : 'request_failed' };
    }
  }
  // Each runtime probes its own public catalog. Store health must not depend
  // on an LMS program table being present in its database boundary.
  const catalog = getPublicRuntimeService() === 'store' ? 'products' : 'programs';
  const [auth, database] = await Promise.all([
    probe('/auth/v1/settings'), probe(`/rest/v1/${catalog}?select=id&limit=1`),
  ]);
  const failed = !auth.ok ? auth : !database.ok ? database : null;
  return { ok: auth.ok && database.ok, status: failed ? failed.status : 200,
    latencyMs: Date.now() - started, ...(failed ? { error: failed.error } : {}), checks: { auth, database } };
}
