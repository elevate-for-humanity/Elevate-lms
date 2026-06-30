import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'Elevate for Humanity API',
      version: '2026-06-10',
      description: 'Operational API index for implemented public and authenticated Elevate endpoints.',
    },
    paths: {
      '/api/auth/login': { post: { summary: 'Legacy alias for sign in' } },
      '/api/auth/logout': { post: { summary: 'Legacy alias for sign out' } },
      '/api/provider/programs/submit': { post: { summary: 'Submit provider program for approval' } },
      '/api/provider/programs/list': { get: { summary: 'List provider program approvals' } },
      '/api/provider/programs/{id}/review': { post: { summary: 'Review provider program approval' } },
      '/api/provider/export': { post: { summary: 'Generate provider CSV export' } },
      '/api/reports/enrollments': { get: { summary: 'Admin enrollment report' } },
      '/api/reports/completions': { get: { summary: 'Admin completion report' } },
      '/api/reports/credentials': { get: { summary: 'Admin credential report' } },
      '/api/reports/funding': { get: { summary: 'Admin funding report' } },
      '/api/reports/rapids': { get: { summary: 'Admin RAPIDS/apprenticeship report' } },
      '/api/system-status': { get: { summary: 'Runtime configuration status' } },
    },
  });
}
