import { NextRequest, NextResponse } from 'next/server';
import { getPageGuide } from '@/lib/store/db';
import { apiAuthGuard } from '@/lib/authGuards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const guide = await getPageGuide(pageId);
    
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    console.error('Guide API error:', error);
    return NextResponse.json({ error: 'Failed to fetch guide' }, { status: 500 });
  }
}
