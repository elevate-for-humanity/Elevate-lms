import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';

/** Studio Shell retired — no WebSocket PTY on admin runtime. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  return NextResponse.json(
    {
      error: 'Studio Shell has been removed. Use Lizzy on /dashboard (Command, Files, Deploy via GitHub Actions).',
      retired: true,
    },
    { status: 410 },
  );
}
