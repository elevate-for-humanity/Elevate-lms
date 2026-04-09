import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getAchievedMilestones, COSMETOLOGY_MILESTONES } from '@/lib/pwa/milestones';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, email, phone')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('created_at, partners:partner_id(name, city, state)')
      .eq('user_id', user.id)
      .eq('role', 'apprentice')
      .single();

    const { data: progressEntries } = await supabase
      .from('progress_entries')
      .select('hours_worked')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'COSMETOLOGY');

    const totalHours = progressEntries?.reduce((sum, e) => sum + parseFloat(e.hours_worked ?? 0), 0) ?? 0;
    const achieved = getAchievedMilestones(totalHours, 'cosmetology');
    const partner = partnerUser?.partners as any;

    return NextResponse.json({
      id: profile.id,
      name: profile.full_name ?? profile.first_name ?? user.email?.split('@')[0] ?? 'Apprentice',
      email: profile.email ?? user.email,
      phone: profile.phone,
      shopName: partner?.name ?? 'Not yet assigned',
      shopCity: partner?.city,
      shopState: partner?.state,
      startDate: partnerUser?.created_at ?? user.created_at,
      totalHours,
      targetHours: 2000,
      milestonesAchieved: achieved.length,
      totalMilestones: COSMETOLOGY_MILESTONES.length,
    });
  } catch (error) {
    logger.error('Cosmetology profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/pwa/cosmetology/profile', _GET);
