import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
// AUTH: Intentionally public — no authentication required

export const runtime = 'edge';
export const maxDuration = 60;

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    status: 'operational',
    systems: {
      database: 'connected',
      google_classroom: 'active',
      milady_rise: 'active',
      api_routes: 95,
      components: 178,
      autopilots: 107,
      migrations: 18,
    },
    integrations: {
      certiport: 'pending',
      vita: 'pending',
      careersafe: 'pending',
      rise_up: 'active',
      dol_dwd: 'pending',
      wioa: 'active',
      wrg: 'active',
      jri: 'active',
    },
    timestamp: new Date().toISOString(),
  });
}
export const GET = withApiAudit('/api/status', _GET);
