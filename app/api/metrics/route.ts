export const runtime = 'edge';
export const maxDuration = 60;
// AUTH: Intentionally public — no authentication required

// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

let requestCount = 0;

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const metrics = [
    '# HELP efh_http_requests_total Total HTTP requests handled by the application',
    '# TYPE efh_http_requests_total counter',
    `efh_http_requests_total ${requestCount}`,
  ].join('\n');

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
    },
  });
}

export function incrementRequestCount() {
  requestCount++;
}
