'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Building, ArrowLeft, Upload, MapPin, Globe, Phone, Mail, Save, Loader2, CheckCircle } from 'lucide-react';

const BENEFITS_LIST = [
  'Health Insurance', 'Dental Insurance', 'Vision Insurance',
  '401(k) / Retirement', 'Paid Time Off', 'Sick Leave',
  'Parental Leave', 'Life Insurance', 'Disability Insurance',
  'Tuition Assistance', 'Training Programs', 'Flexible Schedule',
  'Remote Work Options', 'Employee Discounts', 'Wellness Programs',
];

const INDUSTRIES = [
  'Healthcare', 'Technology', 'Manufacturing', 'Retail',
  'Hospitality', 'Construction', 'Transportation', 'Education', 'Other',
];

export default function CompanySetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    description: '',
    ein: '',
    website: '',
    phone: '',
    hr_email: '',
    address: '',
    benefits: [] as string[],
  });

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/employer-portal/company/setup');
        return;
      }

      const { data: profile } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setForm({
          company_name: profile.company_name || '',
          industry: profile.industry || '',
          company_size: profile.company_size || '',
          description: profile.description || '',
          ein: profile.ein || '',
          website: profile.website || '',
          phone: profile.phone || '',
          hr_email: profile.hr_email || '',
          address: profile.address || '',
          benefits: profile.benefits || [],
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const toggleBenefit = (benefit: string) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit],
    }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: upsertError } = await supabase
        .from('employer_profiles')
        .upsert({
          id: user.id,
          company_name: form.company_name,
          industry: form.industry,
          company_size: form.company_size,
          description: form.description,
          ein: form.ein,
          website: form.website,
          phone: form.phone,
          hr_email: form.hr_email,
          address: form.address,
          benefits: form.benefits,
        }, { onConflict: 'id' });

      if (upsertError) {
        setError(upsertError.message);
      } else {
        setSaved(true);
      }
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate completion percentage
  const fields = [form.company_name, form.industry, form.description, form.phone, form.hr_email, form.address];
  const filled = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Company Setup" }]} />

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/employer-portal/company" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Company Profile
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Setup</h1>
              <p className="text-gray-600">Complete your company profile to start hiring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm font-bold text-brand-blue-600">{completion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-brand-blue-600 h-2 rounded-full transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700">{error}</div>
        )}

        {saved && (
          <div className="mb-6 p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg text-brand-green-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Profile saved.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input type="text" name="company_name" value={form.company_name} onChange={handleChange} required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                  <select name="industry" value={form.industry} onChange={handleChange} required
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size *</label>
                  <select name="company_size" value={form.company_size} onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option value="">Select size</option>
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>50-200 employees</option>
                    <option>201-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Your Company *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} required
                  placeholder="Describe your company..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EIN (Tax ID)</label>
                <input type="text" name="ein" value={form.ein} onChange={handleChange} placeholder="XX-XXXXXXX"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                <p className="text-xs text-gray-500 mt-1">Required for WOTC tax credit processing</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="url" name="website" value={form.website} onChange={handleChange} placeholder="www.yourcompany.com"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HR Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" name="hr_email" value={form.hr_email} onChange={handleChange} required placeholder="hr@yourcompany.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea name="address" value={form.address} onChange={handleChange} rows={2} required
                    placeholder="Street address, City, State ZIP"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Benefits Offered</h2>
            <p className="text-gray-600 mb-4">Select the benefits your company offers to employees:</p>
            <div className="grid md:grid-cols-3 gap-3">
              {BENEFITS_LIST.map((benefit) => (
                <label key={benefit} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-brand-blue-300">
                  <input type="checkbox" checked={form.benefits.includes(benefit)} onChange={() => toggleBenefit(benefit)}
                    className="w-4 h-4 text-brand-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/employer-portal/company" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
