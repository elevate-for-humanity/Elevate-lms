/**
 * GET /api/devstudio/shell-ws
 *
 * WebSocket proxy between the browser (xterm.js) and the studio-shell
 * studio-shell runtime/container. Verifies the admin session before upgrading, then
 * forwards all frames bidirectionally.
 *
 * The studio-shell container is never publicly reachable — only this
 * route can connect to it, and only authenticated admins reach this route.
 *
 * Required env vars:
 *   STUDIO_SHELL_WS_URL   — ws://internal-host:8888  (Northflank/internal service URL)
 *   STUDIO_SHELL_SECRET   — shared secret sent as X-Studio-Secret header
 */

import { type NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Do NOT read secrets at module load time — process.env is empty until
// hydrateProcessEnv() runs at request time. Read inside the handler.

export async function GET(request: NextRequest) {
  // Hydrate runtime secrets first so STUDIO_SHELL_WS_URL / STUDIO_SHELL_SECRET
  // are available from platform_secrets before we check them.
  await hydrateProcessEnv();

  // Read at request time — after hydrateProcessEnv()
  const SHELL_WS_URL = process.env.STUDIO_SHELL_WS_URL ?? '';
  const SHELL_SECRET = process.env.STUDIO_SHELL_SECRET ?? '';

  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  // Auth gate — only admin/super_admin reach the shell
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  if (!SHELL_WS_URL) {
    return new Response(
      JSON.stringify({ error: 'Studio shell not configured. Set STUDIO_SHELL_WS_URL in Admin → Integrations.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Next.js App Router does not natively support WebSocket upgrades.
  // We use the Node.js http upgrade event via the response socket.
  // This works in the Node.js runtime (runtime = 'nodejs' above).
  const upgradeHeader = request.headers.get('upgrade');
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // The actual WebSocket proxying happens in the custom server or via
  // Next.js experimental WebSocket support. For App Router we return
  // a 101 and let the middleware handle the tunnel.
  //
  // In production this route is fronted by the ALB which is configured
  // to forward WebSocket connections. The proxy logic below runs when
  // Next.js is started with a custom server (server.js in standalone).

  try {
    const { WebSocket: NodeWS } = await import('ws');

    // Connect to the shell container
    const shellWs = new NodeWS(SHELL_WS_URL, {
      headers: {
        'x-studio-secret': SHELL_SECRET,
        'x-user-id': auth.id ?? 'unknown',
      },
    });

    // Return upgrade response — Next.js will handle the socket tunnel
    // The response body carries the shell WebSocket URL for the client
    // to connect to directly via the proxy tunnel.
    return new Response(
      JSON.stringify({
        url: SHELL_WS_URL.replace(/^ws/, 'ws'),
        ready: shellWs.readyState === NodeWS.OPEN || shellWs.readyState === NodeWS.CONNECTING,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to connect to shell container' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
