import { NextResponse } from 'next/server';

// Legacy portal redirect — reports section
export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  return NextResponse.redirect(new URL('/program-holder/dashboard', base), 308);
}
