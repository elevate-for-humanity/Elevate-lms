import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's barber apprenticeship enrollment
    let enrollmentDate = null;
    const { data: enrollment } = await supabase
      .from('student_enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('program_slug', 'barber-apprenticeship')
      .single();

    if (enrollment) {
      enrollmentDate = enrollment.created_at;
    } else {
      // Check enrollments table as fallback
      const { data: altEnrollment } = await supabase
        .from('enrollments')
        .select('*, programs(slug, title)')
        .eq('user_id', user.id)
        .single();
      
      if (altEnrollment && (altEnrollment.programs as any)?.slug === 'barber-apprenticeship') {
        enrollmentDate = altEnrollment.created_at;
      }
    }

    // Get progress entries for this apprentice
    const { data: progressEntries } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'BARBER')
      .order('week_ending', { ascending: false });

    // Calculate total hours
    const totalHours = progressEntries?.reduce((sum, entry) => sum + parseFloat(entry.hours_worked || 0), 0) || 0;

    // Get weekly breakdown (last 4 weeks)
    const weeklyData = progressEntries?.slice(0, 4).map(entry => ({
      weekEnding: entry.week_ending,
      hours: parseFloat(entry.hours_worked),
      status: entry.status,
    })) || [];

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, first_name')
      .eq('id', user.id)
      .single();

    // Get partner/shop info if assigned
    let shopName = 'Not yet assigned';
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .single();

    if (partnerUser?.partner_id) {
      const { data: partner } = await supabase
        .from('partners')
        .select('name')
        .eq('id', partnerUser.partner_id)
        .single();
      
      if (partner) {
        shopName = partner.name;
      }
    }

    // Calculate milestones
    const milestones = [
      { hours: 500, title: 'Beginner', achieved: totalHours >= 500 },
      { hours: 1000, title: 'Intermediate', achieved: totalHours >= 1000 },
      { hours: 1500, title: 'Advanced', achieved: totalHours >= 1500 },
      { hours: 2000, title: 'Licensure Ready', achieved: totalHours >= 2000 },
    ];

    const nextMilestone = milestones.find(m => !m.achieved)?.hours || 2000;

    // If no enrollment and no progress, user is not enrolled
    if (!enrollmentDate && (!progressEntries || progressEntries.length === 0)) {
      return NextResponse.json({ 
        error: 'No barber apprenticeship enrollment found',
        enrolled: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      enrolled: true,
      apprentice: {
        name: profile?.full_name || profile?.first_name || 'Apprentice',
        totalHours: totalHours,
        weeklyHours: weeklyData[0]?.hours || 0,
        startDate: enrollmentDate,
        shopName,
        nextMilestone,
      },
      weeklyData,
      milestones,
      targetHours: 2000,
    });
  } catch (error) {
    logger.error('Error fetching barber progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
