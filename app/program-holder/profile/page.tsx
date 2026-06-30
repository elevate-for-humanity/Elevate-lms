import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileEditForm from './ProfileEditForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile | Program Holder Portal',
  robots: { index: false, follow: false },
};

export default async function ProgramHolderProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, address, city, state, zip, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['program_holder', 'admin', 'super_admin'].includes(profile.role ?? '')) {
    redirect('/login');
  }

  return <ProfileEditForm profile={profile} />;
}
