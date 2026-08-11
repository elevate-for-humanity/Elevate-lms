import { NextResponse } from 'next/server';

/**
 * Program Holder denial is an Admin-only mutation.
 *
 * The public Marketing endpoint is intentionally closed. Review actions belong
 * to the authenticated Admin service, which also owns applicant notification
 * and audit logging.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Program Holder application review is available only in the Admin portal.' },
    { status: 410 },
  );
}
