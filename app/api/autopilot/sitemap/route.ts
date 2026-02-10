import { NextResponse } from 'next/server';
import { generateSitemap } from '@/lib/autopilot/deploy-prep';
import { apiRequireAdmin } from '@/lib/authGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    const result = await generateSitemap();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Sitemap generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    const result = await generateSitemap();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Sitemap generation failed' },
      { status: 500 }
    );
  }
}
