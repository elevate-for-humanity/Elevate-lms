import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enhanceMedia } from '@/lib/autopilot/deploy-prep';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mediaUrl, resize, optimize, format } = body;

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
    }

    const result = await enhanceMedia(mediaUrl, { resize, optimize, format });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Media enhance error:', error);
    return NextResponse.json(
      { error: 'Media enhancement failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
