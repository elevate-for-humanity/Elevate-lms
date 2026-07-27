import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Calendar, Award, Edit2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Profile | Elevate for Humanity',
  description: 'View and manage your profile information.',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/profile');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const profileData = profile || {
    full_name: user.user_metadata?.full_name || 'Student',
    phone: user.user_metadata?.phone || '',
    address: '',
    city: '',
    state: '',
    zip: '',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'Profile' }]} />
      
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">My Profile</h1>
              <p className="text-slate-600 mt-1">Manage your account information.</p>
            </div>
            <button className="flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue-700">
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avatar & Quick Stats */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <div className="w-24 h-24 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-brand-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-black">{profileData.full_name}</h2>
                <p className="text-slate-500 text-sm">{user.email}</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
                <h3 className="font-bold text-black mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/certifications" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-slate-700">
                    <Award className="w-4 h-4 text-brand-blue-600" />
                    <span className="text-sm">My Credentials</span>
                  </Link>
                  <Link href="/billing" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-slate-700">
                    <Award className="w-4 h-4 text-brand-blue-600" />
                    <span className="text-sm">Billing & Payments</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-slate-700">
                    <Award className="w-4 h-4 text-brand-blue-600" />
                    <span className="text-sm">Account Settings</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-black mb-6">Personal Information</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-black">{profileData.full_name}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-black">{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Phone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-black">{profileData.phone || 'Not provided'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">Location</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-black">
                          {profileData.city && profileData.state 
                            ? `${profileData.city}, ${profileData.state}` 
                            : 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
                <h3 className="text-lg font-bold text-black mb-4">Current Program</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-500 text-sm">No active enrollment</p>
                  <Link href="/apply" className="inline-block mt-2 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                    Browse Programs →
                  </Link>
                </div>
              </div>

              {/* Career Goals */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
                <h3 className="text-lg font-bold text-black mb-4">Career Goals</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-500 text-sm">Career goals not set</p>
                  <button className="mt-2 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                    Add Career Goals →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
