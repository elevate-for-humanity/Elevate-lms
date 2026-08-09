import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.redirect('https://www.elevateforhumanity.org/blog/rss.xml', 308);
}
