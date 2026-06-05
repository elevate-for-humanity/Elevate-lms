/**
 * Probe the elevate-studio runtime (PTY + repo clone) via its HTTP /health endpoint.
 */

export type ShellProbe = {
  reachable: boolean;
  ready: boolean;
  status: string;
  setupStatus?: string;
  hasGitDir?: boolean;
  gitVersion?: string | null;
  pnpmVersion?: string | null;
  nodeVersion?: string | null;
  error?: string;
};

export function shellHealthUrl(wsUrl: string): string | null {
  if (!wsUrl) return null;
  try {
    const url = new URL(wsUrl);
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '/health';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

export async function probeStudioShell(wsUrl: string): Promise<ShellProbe> {
  const healthUrl = shellHealthUrl(wsUrl);
  if (!healthUrl) {
    return { reachable: false, ready: false, status: 'missing-url' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(healthUrl, { cache: 'no-store', signal: controller.signal });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      reachable: true,
      ready: res.ok && body.ready === true,
      status: String(body.status ?? (res.ok ? 'ok' : 'not-ready')),
      setupStatus: body.setupStatus != null ? String(body.setupStatus) : undefined,
      hasGitDir: body.hasGitDir === true,
      gitVersion: (body.gitVersion as string | null) ?? null,
      pnpmVersion: (body.pnpmVersion as string | null) ?? null,
      nodeVersion: (body.nodeVersion as string | null) ?? null,
    };
  } catch (err) {
    return {
      reachable: false,
      ready: false,
      status: 'unreachable',
      error: err instanceof Error ? err.name : 'unknown',
    };
  } finally {
    clearTimeout(timeout);
  }
}
