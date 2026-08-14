import { NextResponse } from 'next/server';

/** Studio Shell retired — shell tokens are no longer issued. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Studio Shell has been removed. Use Lizzy on /admin/dashboard for deploy and platform commands.',
      retired: true,
    },
    { status: 410 },
  );
}
