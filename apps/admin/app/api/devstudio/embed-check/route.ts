import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Checks whether a URL can be embedded in an iframe by inspecting
 * X-Frame-Options and CSP frame-ancestors response headers.
 *
 * Returns { embeddable: boolean, reason?: string }
 *
 * Strategy:
 *   1. HEAD request (fast, no body)
 *   2. If HEAD returns 405/501, retry with GET + Range: bytes=0-0
 *   3. If GET also fails, fall through to embeddable:true (let iframe try)
 *
 * HTTP status handling:
 *   2xx / 3xx  → inspect headers
 *   401 / 403  → embeddable:false (server will likely block the iframe too)
 *   404        → embeddable:false (page doesn't exist)
 *   429        → embeddable:true  (rate-limited us, not the iframe)
 *   4xx other  → embeddable:true  (unknown client error, let iframe try)
 *   5xx        → embeddable:true  (server error, let iframe try)
 *   timeout    → embeddable:true  (slow server, let iframe try)
 *   network err→ embeddable:true  (DNS/TCP failure, let iframe try)
 */

type EmbedResult = { embeddable: boolean; reason?: string };

function checkHeaders(res: Response): EmbedResult {
  const xfo = res.headers.get('x-frame-options') ?? '';
  const csp = res.headers.get('content-security-policy') ?? '';

  if (/deny|sameorigin/i.test(xfo)) {
    return { embeddable: false, reason: `X-Frame-Options: ${xfo.toUpperCase()}` };
  }

  const faMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
  if (faMatch) {
    const fa = faMatch[1].trim();
    // 'none' → no framing allowed at all.
    // 'self' → same-origin framing is allowed; the admin app embeds its own
    //          origin so this is embeddable. Do NOT block on 'self'.
    if (/^'none'$/i.test(fa)) {
      return { embeddable: false, reason: `CSP frame-ancestors: 'none'` };
    }
  }

  return { embeddable: true };
}

function statusToResult(status: number): EmbedResult | null {
  // null means "inspect headers normally"
  if (status >= 200 && status < 400) return null;
  if (status === 401) return { embeddable: false, reason: 'HTTP 401 Unauthorized' };
  if (status === 403) return { embeddable: false, reason: 'HTTP 403 Forbidden' };
  if (status === 404) return { embeddable: false, reason: 'HTTP 404 Not Found' };
  if (status === 429) return { embeddable: true,  reason: 'HTTP 429 rate-limited check' };
  // All other 4xx / 5xx: unknown — let the iframe try
  return { embeddable: true, reason: `HTTP ${status}` };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms = 5000,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function probe(url: string, reqHeaders: Record<string, string>): Promise<EmbedResult> {
  // ── HEAD attempt ──────────────────────────────────────────────────────────
  let headRes: Response | null = null;
  try {
    headRes = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow', headers: reqHeaders });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { embeddable: true, reason: 'HEAD timed out' };
    }
    // DNS / TCP failure on HEAD — fall through to GET attempt below
  }

  if (headRes !== null) {
    // 405 / 501 → server doesn't support HEAD, retry with GET
    if (headRes.status !== 405 && headRes.status !== 501) {
      const statusResult = statusToResult(headRes.status);
      if (statusResult) return statusResult;
      return checkHeaders(headRes);
    }
  }

  // ── GET fallback (HEAD unsupported or HEAD network-failed) ────────────────
  try {
    const getRes = await fetchWithTimeout(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { ...reqHeaders, Range: 'bytes=0-0' },
    });

    const statusResult = statusToResult(getRes.status);
    if (statusResult) return statusResult;
    return checkHeaders(getRes);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { embeddable: true, reason: 'GET timed out' };
    }
    const msg = err instanceof Error ? err.message : 'network error';
    return { embeddable: true, reason: `unreachable: ${msg}` };
  }
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) {
    return NextResponse.json({ embeddable: false, reason: 'missing url param' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ embeddable: false, reason: 'unsupported protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ embeddable: false, reason: 'invalid url' }, { status: 400 });
  }

  // Localhost / RFC-1918 ranges are always embeddable (local dev servers)
  const host = parsed.hostname;
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.16.') ||
    host.endsWith('.local')
  ) {
    return NextResponse.json({ embeddable: true, reason: 'local' });
  }

  const result = await probe(parsed.toString(), {
    'User-Agent': 'Mozilla/5.0 (compatible; ElevateDevStudio/1.0)',
  });

  return NextResponse.json(result);
}
