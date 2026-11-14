import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireCreator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: creator } = await supabase
    .from('marketplace_creators')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // A missing or pending creator record is an access state, not an application
  // crash. Send the user back to their workspace with a useful notice.
  if (!creator) {
    redirect('/lms/dashboard?notice=creator-access-required');
  }

  if (creator.status !== 'approved') {
    redirect('/lms/dashboard?notice=creator-approval-pending');
  }

  return { user, creator };
}

export async function getCreatorProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: creator } = await supabase
      .from('marketplace_creators')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return creator;
  } catch (error) {
    return null;
  }
}

export async function isApprovedCreator(): Promise<boolean> {
  const creator = await getCreatorProfile();
  return creator?.status === 'approved';
}
