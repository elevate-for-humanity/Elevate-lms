export const runtime = 'edge';
export const maxDuration = 60;

// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/authGuards';

let requestCount = 0;

export async function GET() {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
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
