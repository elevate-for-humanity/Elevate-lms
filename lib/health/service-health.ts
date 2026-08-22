export type RuntimeReadiness = {
  ready: boolean;
  missing: string[];
  commit: string;
  buildId: string;
  builtAt: string;
};

export type DependencyHealth = {
  ok: boolean;
  status: number | null;
  latencyMs: number;
  error?: string;
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
    process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? process.env.NEXT_PUBLIC_GIT_SHA,
  );
  const buildId = normalized(process.env.NEXT_PUBLIC_BUILD_ID);
  const builtAt = normalized(process.env.BUILD_TIMESTAMP);

  if (!commit || commit === 'unknown' || commit === 'MISSING') missing.push('BUILD_COMMIT');

  return {
    ready: missing.length === 0,
    missing: [...new Set(missing)],
    commit: commit || 'unknown',
    buildId: buildId || 'unknown',
    builtAt: builtAt || 'unknown',
  };
}

export async function checkSupabaseHealth(timeoutMs = 2500): Promise<DependencyHealth> {
  const url = normalized(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/, '');
  const anonKey = normalized(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const started = Date.now();

  if (!url || !anonKey) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: 'missing_configuration',
    };
  }

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });

    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - started,
      ...(response.ok ? {} : { error: 'non_success_status' }),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.name : 'request_failed',
    };
  }
}
