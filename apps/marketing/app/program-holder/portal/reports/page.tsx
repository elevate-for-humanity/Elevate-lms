import { NextResponse } from 'next/server';

// Legacy portal redirect — reports section
export function GET() {
  return NextResponse.redirect(
    new URL('/program-holder/dashboard', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'),
    308
  );
}
