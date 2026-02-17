import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get checklists for user's role
    const { data: checklists, error: checklistsError } = await supabase
      .from('qa_checklists')
      .select('*')
      .eq('is_active', true)
      .or(`assignee_role.eq.${profile.role},assignee_role.is.null`)
      .order('frequency');

    if (checklistsError) {
      return NextResponse.json(
        { error: 'Failed to fetch checklists' },
        { status: 500 }
      );
    }

    // Get user's completions for today
    const today = new Date().toISOString().split('T')[0];
    const { data: completions, error: completionsError } = await supabase
      .from('qa_checklist_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`);

    if (completionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch completions' },
        { status: 500 }
      );
    }

    // Combine checklists with completion status
    const checklistsWithStatus = checklists?.map((checklist) => {
      const completion = completions?.find(
        (c) => c.checklist_id === checklist.id
      );
      return {
        ...checklist,
        completed: !!completion,
        completion: completion || null,
      };
    });

    return NextResponse.json({
      checklists: checklistsWithStatus,
      totalChecklists: checklists?.length || 0,
      completedToday: completions?.length || 0,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { checklist_id, notes } = body;

    if (!checklist_id) {
      return NextResponse.json(
        { error: 'checklist_id is required' },
        { status: 400 }
      );
    }

    // Verify checklist exists
    const { data: checklist, error: checklistError } = await supabase
      .from('qa_checklists')
      .select('*')
      .eq('id', checklist_id)
      .single();

    if (checklistError || !checklist) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    // Create completion
    const { data: completion, error: completionError } = await supabase
      .from('qa_checklist_completions')
      .insert({
        checklist_id,
        user_id: user.id,
        notes: notes || null,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (completionError) {
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completion,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
