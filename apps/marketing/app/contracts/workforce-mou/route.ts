import { NextResponse } from 'next/server';

/**
 * Retired public template route.
 *
 * This URL previously exposed a workforce-MOU template that search engines could
 * mistake for an executed agreement. Return 410 so crawlers remove it from their
 * index and do not treat template content as institutional evidence.
 */
export async function GET() {
  return new NextResponse('This public template has been retired.', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  });
}
