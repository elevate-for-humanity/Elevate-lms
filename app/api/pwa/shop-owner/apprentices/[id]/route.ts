import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const MILESTONES = [
  { hours: 500, title: 'Beginner', achieved: false },
  { hours: 1000, title: 'Intermediate', achieved: false },
  { hours: 1500, title: 'Advanced', achieved: false },
  { hours: 2000, title: 'Licensure Ready', achieved: false },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { id: apprenticeId } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's partner association
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not associated with a partner shop',
      }, { status: 404 });
    }

    // Verify apprentice is assigned to this partner
    const { data: apprenticeAssignment } = await db
      .from('partner_users')
      .select('created_at')
      .eq('user_id', apprenticeId)
      .eq('partner_id', partnerUser.partner_id)
      .eq('role', 'apprentice')
      .single();

    if (!apprenticeAssignment) {
      return NextResponse.json({ 
        error: 'Apprentice not found or not assigned to your shop',
      }, { status: 404 });
    }

    // Get apprentice profile
    const { data: profile } = await db
      .from('profiles')
      .select('id, full_name, first_name, email, phone, created_at')
      .eq('id', apprenticeId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Apprentice profile not found' }, { status: 404 });
    }

    // Get all progress entries
    const { data: progressEntries } = await db
      .from('progress_entries')
      .select('*')
      .eq('apprentice_id', apprenticeId)
      .eq('partner_id', partnerUser.partner_id)
      .order('week_ending', { ascending: false });

    // Calculate totals
    const totalHours = progressEntries?.reduce(
      (sum, p) => sum + parseFloat(p.hours_worked || 0), 0
    ) || 0;

    // Weekly data (last 8 weeks)
    const weeklyData = (progressEntries || []).slice(0, 8).map(entry => ({
      weekEnding: entry.week_ending,
      hours: parseFloat(entry.hours_worked || 0),
      status: entry.status,
      notes: entry.notes,
    }));

    // Calculate weekly average
    const weekCount = weeklyData.length;
    const weeklyAvg = weekCount > 0 
      ? Math.round(totalHours / weekCount) 
      : 0;

    // Current week hours
    const weeklyHours = weeklyData[0]?.hours || 0;

    // Milestones with achievement status
    const milestones = MILESTONES.map(m => ({
      ...m,
      achieved: totalHours >= m.hours,
    }));

    // Next milestone
    const nextMilestone = milestones.find(m => !m.achieved)?.hours || 2000;

    // Estimated completion
    let estimatedCompletion = null;
    if (weeklyAvg > 0 && totalHours < 2000) {
      const remaining = 2000 - totalHours;
      const weeksRemaining = Math.ceil(remaining / weeklyAvg);
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + (weeksRemaining * 7));
      estimatedCompletion = completionDate.toISOString();
    }

    // Compliance status
    let complianceStatus: 'compliant' | 'warning' | 'non-compliant' = 'compliant';
    if (weeklyHours < 20) {
      complianceStatus = 'non-compliant';
    } else if (weeklyHours < 30) {
      complianceStatus = 'warning';
    }

    return NextResponse.json({
      apprentice: {
        id: profile.id,
        name: profile.full_name || profile.first_name || 'Apprentice',
        email: profile.email,
        phone: profile.phone,
        startDate: apprenticeAssignment.created_at,
        totalHours,
        weeklyHours,
        weeklyAvg,
        targetHours: 2000,
        progress: (totalHours / 2000) * 100,
        nextMilestone,
        estimatedCompletion,
        complianceStatus,
      },
      weeklyData,
      milestones,
      recentEntries: progressEntries?.slice(0, 10) || [],
    });
  } catch (error) {
    logger.error('Error fetching apprentice details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
