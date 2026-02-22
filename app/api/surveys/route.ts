import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { surveyId, responses, metadata } = body;

    const { data, error } = await db
      .from('survey_responses')
      .insert({
        survey_id: surveyId,
        user_id: user?.id || null,
        responses,
        metadata,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Survey submission error:', error);
      return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    logger.error('Survey API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('id');

    if (surveyId) {
      const { data, error } = await db
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
      }

      return NextResponse.json({ survey: data });
    }

    // List active surveys
    const { data, error } = await db
      .from('surveys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
    }

    return NextResponse.json({ surveys: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
