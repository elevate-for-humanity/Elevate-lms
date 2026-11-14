import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/api/requireAdminRole';

export const dynamic = 'force-dynamic';

const retired = async () => {
  const authError = await requireAdminRole();
  if (authError) return authError;

  return NextResponse.json(
    {
      error: 'FSSA SNAP E&T routes have been retired',
      message: 'Use the canonical workforce case-management APIs.',
    },
    { status: 410 },
  );
};

export const GET = retired;
export const POST = retired;
export const DELETE = retired;
