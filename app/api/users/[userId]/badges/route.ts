import { apiAuthGuard } from '@/lib/admin/guards';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { userId } = await params;
  const supabase = await createClient();

  // Fetch user badges/achievements
  const { data: badges, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    // Fall back to user_badges if achievements doesn't have user_id
    const { data: userBadges, error: badgeError } = await supabase
      .from('user_badges')
      .select('*, badge_definitions(*)')
      .eq('user_id', userId);

    if (badgeError) {
      return NextResponse.json({ error: 'Badge operation failed' }, { status: 500 });
    }

    return NextResponse.json(userBadges || []);
  }

  return NextResponse.json(badges || []);
}
export const GET = withApiAudit('/api/users/[userId]/badges', _GET);
