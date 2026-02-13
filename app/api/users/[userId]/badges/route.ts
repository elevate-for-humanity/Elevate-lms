import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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
      return NextResponse.json({ error: badgeError.message }, { status: 500 });
    }

    return NextResponse.json(userBadges || []);
  }

  return NextResponse.json(badges || []);
}
