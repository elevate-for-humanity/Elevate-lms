'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Phone,
  MapPin,
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Heart,
} from 'lucide-react';

interface ProfileData {
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

const EMPTY_PROFILE: ProfileData = {
  full_name: '',
  first_name: '',
  last_name: '',
  phone: '',
  address: '',
  city: '',
  state: 'IN',
  zip: '',
  date_of_birth: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
};

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/signin'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setForm({
          full_name: profile.full_name || user.user_metadata?.full_name || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || 'IN',
          zip: profile.zip || '',
          date_of_birth: profile.date_of_birth || '',
          emergency_contact_name: profile.emergency_contact_name || '',
          emergency_contact_phone: profile.emergency_contact_phone || '',
          emergency_contact_relationship: profile.emergency_contact_relationship || '',
        });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'first_name' || name === 'last_name') {
        updated.full_name = `${name === 'first_name' ? value : prev.first_name} ${name === 'last_name' ? value : prev.last_name}`.trim();
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validate required fields
    if (!form.first_name || !form.last_name || !form.phone || !form.emergency_contact_name || !form.emergency_contact_phone) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/signin'); return; }

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          date_of_birth: form.date_of_birth || null,
          emergency_contact_name: form.emergency_contact_name,
          emergency_contact_phone: form.emergency_contact_phone,
          emergency_contact_relationship: form.emergency_contact_relationship,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mark profile step complete in onboarding_progress
      await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          profile_completed: true,
          status: 'in_progress',
        }, { onConflict: 'user_id' });

      setMessage({ type: 'success', text: 'Profile saved! Redirecting to onboarding...' });
      setTimeout(() => router.push('/student-portal/onboarding'), 1500);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/student-portal/onboarding" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Onboarding
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
        <p className="text-slate-600 mb-8">Fill in your personal information and emergency contact. All fields marked * are required.</p>

        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-brand-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
              </div>
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input id="date_of_birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-brand-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Address</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                <input id="address" name="address" value={form.address} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input id="city" name="city" value={form.city} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input id="state" name="state" value={form.state} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-slate-700 mb-1">ZIP</label>
                  <input id="zip" name="zip" value={form.zip} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900">Emergency Contact</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                <input id="emergency_contact_name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
              </div>
              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-slate-700 mb-1">Contact Phone *</label>
                <input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
              </div>
              <div>
                <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                <select id="emergency_contact_relationship" name="emergency_contact_relationship" value={form.emergency_contact_relationship} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                  <option value="">Select...</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
