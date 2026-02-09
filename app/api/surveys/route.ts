import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { surveyId, responses, metadata } = body;

    const { data, error } = await supabase
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
      console.error('Survey submission error:', error);
      return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Survey API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('id');

    if (surveyId) {
      const { data, error } = await supabase
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
    const { data, error } = await supabase
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
