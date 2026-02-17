import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — no authentication required

export const runtime = 'edge';
export const maxDuration = 60;

export async function GET(request: Request) {
  
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
