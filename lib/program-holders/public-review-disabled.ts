import { NextResponse } from 'next/server';

export function publicProgramHolderReviewDisabled(action: 'approval' | 'rejection') {
  return NextResponse.json(
    {
      error: `Program Holder ${action} is available only in the authenticated Admin portal.`,
    },
    { status: 410 },
  );
}
