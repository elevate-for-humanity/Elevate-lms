import { NextResponse } from 'next/server';

// Redirect-only route — verification is handled within the dashboard
export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  return NextResponse.redirect(new URL('/program-holder/dashboard', base), {
    status: 307,
    headers: { 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
