import { NextResponse } from 'next/server';

/** Studio Shell retired — no WebSocket PTY on admin runtime. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      error:
        'Studio Shell has been removed. Use Lizzy on /admin/dashboard (Command, Files, Deploy via GitHub Actions).',
      retired: true,
    },
    { status: 410 },
  );
}
