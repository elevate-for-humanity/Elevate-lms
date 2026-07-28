import { NextResponse } from 'next/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Legacy portal redirect — students section
export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  return NextResponse.redirect(new URL('/program-holder/dashboard', base), {
    status: 308,
    headers: { 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
