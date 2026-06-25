import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getAchievedMilestones, COSMETOLOGY_MILESTONES } from '@/lib/pwa/milestones';
import { requireCosmetologyEnrollment } from '@/lib/pwa/cosmetology-auth';
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

    const enrollment = await requireCosmetologyEnrollment(supabase, user.id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in cosmetology apprenticeship' }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, email, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('created_at, partners:partner_id(name, city, state)')
      .eq('user_id', user.id)
      .eq('role', 'apprentice')
      .maybeSingle();

    const { data: progressEntries } = await supabase
      .from('progress_entries')
      .select('hours_worked')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'COSMETOLOGY');

    const totalHours = progressEntries?.reduce((sum, e) => sum + (parseFloat(e.hours_worked) || 0), 0) ?? 0;
    const achieved = totalHours > 0 ? getAchievedMilestones(totalHours, 'cosmetology') : [];
    const partner = partnerUser?.partners as any;
    const salonAssigned = !!partner?.name;

    return NextResponse.json({
      id: profile.id,
      name: profile.full_name ?? profile.first_name ?? user.email?.split('@')[0] ?? 'Apprentice',
      email: profile.email ?? user.email,
      phone: profile.phone,
      shopName: salonAssigned ? partner.name : null,
      shopCity: partner?.city ?? null,
      shopState: partner?.state ?? null,
      salonAssigned,
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
