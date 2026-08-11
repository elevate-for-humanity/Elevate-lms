import { NextResponse } from 'next/server';

/**
 * Program Holder review is an Admin-only mutation.
 *
 * This public Marketing endpoint previously changed application status without
 * enforcing Admin authorization and also wrote columns that do not exist in
 * the production application table. Keep the route closed so old bookmarks or
 * clients cannot mutate review state through the public site.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Program Holder application review is available only in the Admin portal.' },
    { status: 410 },
  );
}
