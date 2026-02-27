export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// WebSocket upgrade endpoint info
// Note: Next.js App Router doesn't support WebSocket upgrades directly
// This endpoint returns connection info for the WebSocket server
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
return NextResponse.json({
    message: 'WebSocket terminal available',
    wsUrl: process.env.TERMINAL_WS_URL || 'ws://localhost:3001',
    instructions: 'Connect to wsUrl for PTY terminal access',
  });
}
export const GET = withApiAudit('/api/studio/ws', _GET);
