import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';

/** Studio Shell retired — shell tokens are no longer issued. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  return NextResponse.json(
    {
      error: 'Studio Shell has been removed. Use Lizzy on /dashboard for deploy and platform commands.',
      retired: true,
    },
    { status: 410 },
  );
}
