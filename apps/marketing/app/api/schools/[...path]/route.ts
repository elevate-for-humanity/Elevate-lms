import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.redirect(new URL('/for-schools', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'), 308);
}

export async function POST() {
  return NextResponse.json({ error: 'School-specific API moved to provider applications.' }, { status: 410 });
}
