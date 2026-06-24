import { logger } from '@/lib/logger';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAchievedMilestones, BARBER_MILESTONES } from '@/lib/pwa/milestones';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, email, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get partner assignment
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select(`
        created_at,
        partners:partner_id (
          name,
          city,
          state
        )
      `)
      .eq('user_id', user.id)
      .eq('role', 'apprentice')
      .maybeSingle();

    // Get total hours
    const { data: progressEntries } = await supabase
      .from('progress_entries')
      .select('hours_worked')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'BARBER');

    const totalHours = progressEntries?.reduce(
      (sum, entry) => sum + parseFloat(entry.hours_worked || 0), 0
    ) || 0;

    const achievedMilestones = getAchievedMilestones(totalHours);

    const partner = partnerUser?.partners as any;

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.full_name || profile.first_name || user.email?.split('@')[0] || 'Apprentice',
        email: profile.email || user.email,
        phone: profile.phone,
        shopName: partner?.name || 'Not assigned',
        shopCity: partner?.city,
        shopState: partner?.state,
        startDate: partnerUser?.created_at || user.created_at,
        totalHours,
        targetHours: 2000,
        milestonesAchieved: achievedMilestones.length,
        totalMilestones: BARBER_MILESTONES.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/pwa/barber/profile', _GET);
