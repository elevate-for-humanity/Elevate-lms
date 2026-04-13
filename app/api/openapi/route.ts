// PUBLIC ROUTE: public OpenAPI spec
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
// AUTH: Intentionally public — no authentication required


export const maxDuration = 60;

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    openapi: '3.0.0',
    info: {
      title: 'Elevate for Humanity API',
      version: '1.0.0',
      description: 'API documentation for Elevate for Humanity platform'
    },
    paths: {}
  });
}
export const GET = withApiAudit('/api/openapi', _GET);
