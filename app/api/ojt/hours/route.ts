import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// POST - Log OJT hours
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      date, 
      hours, 
      minutes = 0,
      description, 
      supervisor_id,
      enrollment_id,
      activity_type = 'on_the_job_training'
    } = body;

    // Validate required fields
    if (!date || (hours === undefined && minutes === undefined)) {
      return NextResponse.json({ error: 'Date and hours/minutes are required' }, { status: 400 });
    }

    const totalMinutes = (hours || 0) * 60 + (minutes || 0);
    if (totalMinutes <= 0) {
      return NextResponse.json({ error: 'Hours must be greater than 0' }, { status: 400 });
    }

    // Insert OJT hours log
    const { data: log, error } = await supabase
      .from('ojt_hours_log')
      .insert({
        student_id: user.id,
        log_date: date,
        hours: hours || Math.floor(totalMinutes / 60),
        minutes: minutes || totalMinutes % 60,
        total_minutes: totalMinutes,
        description: description || null,
        supervisor_id: supervisor_id || null,
        enrollment_id: enrollment_id || null,
        activity_type,
        status: 'pending', // Requires supervisor verification
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error logging OJT hours:', error);
      return NextResponse.json({ error: 'Failed to log hours' }, { status: 500 });
    }

    // Award points for logging hours (10 points per hour)
    const pointsToAward = Math.floor(totalMinutes / 60) * 10;
    if (pointsToAward > 0) {
      await supabase.rpc('increment_points', { 
        user_id: user.id, 
        points_to_add: pointsToAward 
      });
    }

    return NextResponse.json({ 
      success: true, 
      log,
      points_awarded: pointsToAward,
      message: `Logged ${hours || Math.floor(totalMinutes / 60)} hours ${minutes || totalMinutes % 60} minutes`
    });

  } catch (error) {
    logger.error('OJT hours logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch user's OJT hours
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const enrollmentId = searchParams.get('enrollment_id');

    let query = supabase
      .from('ojt_hours_log')
      .select('*')
      .eq('student_id', user.id)
      .order('log_date', { ascending: false });

    if (startDate) {
      query = query.gte('log_date', startDate);
    }
    if (endDate) {
      query = query.lte('log_date', endDate);
    }
    if (enrollmentId) {
      query = query.eq('enrollment_id', enrollmentId);
    }

    const { data: logs, error } = await query.limit(100);

    if (error) {
      logger.error('Error fetching OJT hours:', error);
      return NextResponse.json({ error: 'Failed to fetch hours' }, { status: 500 });
    }

    // Calculate totals
    const totalMinutes = logs?.reduce((sum, log) => sum + (log.total_minutes || 0), 0) || 0;
    const verifiedMinutes = logs?.filter(l => l.status === 'verified').reduce((sum, log) => sum + (log.total_minutes || 0), 0) || 0;

    return NextResponse.json({
      logs,
      summary: {
        total_hours: Math.floor(totalMinutes / 60),
        total_minutes: totalMinutes % 60,
        verified_hours: Math.floor(verifiedMinutes / 60),
        verified_minutes: verifiedMinutes % 60,
        pending_count: logs?.filter(l => l.status === 'pending').length || 0,
      }
    });

  } catch (error) {
    logger.error('OJT hours fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
