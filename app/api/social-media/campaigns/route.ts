import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: campaigns, error } = await supabase
      .from('social_media_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, campaigns });
  } catch (error) { 
    logger.error(
      'Error fetching campaigns:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await req.json();

    const { data: campaign, error } = await supabase
      .from('social_media_campaigns')
      .insert({
        name: body.name,
        content_source: body.contentSource,
        platforms: body.platforms,
        frequency: body.frequency,
        posting_times: body.times,
        program: body.program,
        duration_days: parseInt(body.duration, 10),
        posts: body.posts,
        status: body.status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, campaign });
  } catch (error) { 
    logger.error(
      'Error creating campaign:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
