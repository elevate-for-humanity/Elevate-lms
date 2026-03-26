import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { User, Save, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Profile | Elevate for Humanity',
  robots: { index: false, follow: false },
};

async function updateProfile(formData: FormData) {
  'use server';
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const { createAdminClient: createAdmin } = await import('@/lib/supabase/admin');
  const supabase = await createServerClient();
  const admin = createAdmin();
  const db = admin || supabase;
  if (!supabase) throw new Error('Database unavailable');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('profiles').update({
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || null,
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    zip_code: formData.get('zip_code') as string || null,
  }).eq('id', user.id);

  if (error) {
    console.error('Profile update failed:', error.message);
    throw new Error('Failed to save profile');
  }

  redirect('/onboarding/learner');
}

export default async function EditProfilePage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Edit Profile' }]} />
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-4 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Onboarding</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h1>
        <form action={updateProfile} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input name="full_name" required defaultValue={profile?.full_name || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" type="tel" defaultValue={profile?.phone || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="(317) 314-3757" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input name="address" defaultValue={profile?.address || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input name="city" defaultValue={profile?.city || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input name="state" defaultValue={profile?.state || 'IN'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input name="zip_code" defaultValue={profile?.zip_code || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
