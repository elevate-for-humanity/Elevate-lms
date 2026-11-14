/**
 * GET /api/surveys/workone/responses
 * Get survey responses for admin dashboard
 * 
 * Query params:
 *   ?status=all|submitted|pending
 *   ?needsCallback=true
 *   ?page=1
 *   ?limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin/staff access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const needsCallback = searchParams.get('needsCallback') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('workone_survey_responses')
      .select('*', { count: 'exact' })
      .eq('survey_label', 'workone-funding-survey')
      .order('submitted_at', { ascending: false, nullsFirst: false });

    // Filter by status
    if (status === 'submitted') {
      query = query.not('submitted_at', 'is', null);
    } else if (status === 'pending') {
      query = query.is('submitted_at', null).not('sent_at', 'is', null);
    }

    // Filter by callback needed
    if (needsCallback) {
      query = query.eq('wants_callback', true).not('best_phone', 'is', null);
    }

    const { data: responses, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching survey responses:', error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from('workone_survey_responses')
      .select('went_to_workone, signed_up_for_funding, still_needs_to_go, was_put_in_other_program, was_persuaded_away_from_elevate, wants_callback')
      .eq('survey_label', 'workone-funding-survey')
      .not('submitted_at', 'is', null);

    const summary = {
      totalResponses: stats?.length || 0,
      wentToWorkone: stats?.filter((s) => s.went_to_workone).length || 0,
      signedUpForFunding: stats?.filter((s) => s.signed_up_for_funding).length || 0,
      stillNeedsToGo: stats?.filter((s) => s.still_needs_to_go).length || 0,
      wasPutInOtherProgram: stats?.filter((s) => s.was_put_in_other_program).length || 0,
      wasPersuadedAway: stats?.filter((s) => s.was_persuaded_away_from_elevate).length || 0,
      wantsCallback: stats?.filter((s) => s.wants_callback).length || 0,
    };

    return NextResponse.json({
      responses: responses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      summary,
    });

  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}

/**
 * PATCH /api/surveys/workone/responses
 * Update a survey response (add admin notes)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing response ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('workone_survey_responses')
      .update({ admin_notes: adminNotes })
      .eq('id', id);

    if (error) {
      console.error('Error updating survey response:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating survey response:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
