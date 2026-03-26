import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileForm } from '../../profile/ProfileForm';

export const metadata: Metadata = {
  title: 'Edit Profile | Student Portal',
  description: 'Update your personal information.',
};

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link 
        href="/learner/settings" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h1>
        <p className="text-gray-600 mb-8">Update your personal information below.</p>

        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
