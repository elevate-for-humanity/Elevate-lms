import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/api/requireAdminRole';

export const dynamic = 'force-dynamic';

export async function POST() {
  const authError = await requireAdminRole();
  if (authError) return authError;

  return NextResponse.json(
    {
      error: 'Runtime API-key updates are disabled',
      message: 'Configure SENDGRID_API_KEY in the protected deployment environment.',
    },
    { status: 410 },
  );
}
