export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (userId) {
      // Get user's earned badges
      const { data, error }: any = await supabase
        .from('user_badges')
        .select(
          `
          *,
          badge:badges(*)
        `
        )
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ badges: data });
    } else {
      // Get all available badges
      const { data, error }: any = await supabase
        .from('badges')
        .select('*')
        .order('points', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ badges: data });
    }
  } catch (error) { 
    logger.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { badge_id, user_id } = body;

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Award badge
    const { data, error }: any = await supabase
      .from('user_badges')
      .insert({
        user_id,
        badge_id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update leaderboard
    const { data: badge } = await supabase
      .from('badges')
      .select('points')
      .eq('id', badge_id)
      .single();

    if (badge) {
      await supabase.rpc('update_leaderboard', {
        p_user_id: user_id,
        p_points: badge.points,
        p_badges: 1,
      });
    }

    return NextResponse.json({ badge: data }, { status: 201 });
  } catch (error) { 
    logger.error('Error awarding badge:', error);
    return NextResponse.json(
      { error: 'Failed to award badge' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/gamification/badges', _GET);
export const POST = withApiAudit('/api/gamification/badges', _POST);
