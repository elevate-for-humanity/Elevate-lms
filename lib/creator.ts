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

  if (!creator) {
    throw new Error('Not a creator - apply at /marketplace/apply');
  }

  if (creator.status !== 'approved') {
    throw new Error('Creator account not approved yet');
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
