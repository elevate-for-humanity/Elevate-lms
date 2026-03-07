'use client';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { trackEvent } from '@/components/analytics/google-analytics';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const PARTNER_TYPES = [
  { value: 'barbershop', label: 'Barbershop / Salon', desc: 'Host apprentices for hands-on barber or cosmetology training' },
  { value: 'healthcare', label: 'Healthcare Facility', desc: 'Clinical placement for CNA, phlebotomy, or medical assistant students' },
  { value: 'employer', label: 'Employer Partner', desc: 'Hire graduates or host on-the-job training' },
  { value: 'training_provider', label: 'Training Provider', desc: 'Deliver curriculum as a licensed training site' },
  { value: 'workforce_board', label: 'Workforce Board', desc: 'Coordinate WIOA, JRI, or other funded referrals' },
  { value: 'community_org', label: 'Community Organization', desc: 'Refer participants or provide wraparound services' },
];

export default function PartnerApplyPage() {
  const [formData, setFormData] = useState({
    orgName: '', contactName: '', email: '', phone: '',
    type: '', addressLine1: '', city: '', state: 'Indiana', zip: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/partner/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: formData.orgName,
          ownerName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          programsRequested: [formData.type],
          apprenticeCapacity: 1,
          additionalNotes: formData.description,
          agreedToTerms: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      trackEvent('partner_application', 'conversion', formData.type);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h1>
          <p className="text-gray-600 mb-4">Our team will review your application and contact you within 1-3 business days.</p>
          <p className="text-sm text-gray-500 mb-6">A confirmation email has been sent to <strong>{formData.email}</strong>.</p>
          <div className="space-y-3">
            <Link href="/partner/onboarding" className="block w-full bg-brand-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition text-center">
              Continue to Full Onboarding
            </Link>
            <Link href="/" className="block text-brand-blue-600 font-medium hover:text-brand-blue-700">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-1.jpg" alt="Partner application" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner-portal' }, { label: 'Apply' }]} />
        </div>
      </div>

      <div className="bg-brand-blue-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl font-bold mb-2">Become a Partner</h1>
          <p className="text-brand-blue-100">Join our network of training providers, employers, and community organizations</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Partner Application</h2>
          <p className="text-gray-500 text-sm mb-6">All fields marked * are required. For the full onboarding with document uploads, <Link href="/partner/onboarding" className="text-brand-blue-600 hover:underline">start here instead</Link>.</p>

          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red-600 shrink-0 mt-0.5" />
              <p className="text-brand-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partnership Type *</label>
              <div className="grid gap-3">
                {PARTNER_TYPES.map(t => (
                  <label key={t.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                      formData.type === t.value ? 'border-brand-blue-500 bg-brand-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="type" value={t.value} required
                      checked={formData.type === t.value}
                      onChange={e => update('type', e.target.value)}
                      className="mt-1" />
                    <div>
                      <div className="font-medium text-gray-900">{t.label}</div>
                      <div className="text-sm text-gray-500">{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization / Business Name *</label>
              <input type="text" required value={formData.orgName}
                onChange={e => update('orgName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Legal business name" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                <input type="text" required value={formData.contactName}
                  onChange={e => update('contactName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" required value={formData.email}
                  onChange={e => update('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="email@business.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input type="tel" required value={formData.phone}
                onChange={e => update('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="(317) 555-1234" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
              <input type="text" required value={formData.addressLine1}
                onChange={e => update('addressLine1', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="123 Main St" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input type="text" required value={formData.city}
                  onChange={e => update('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="Indianapolis" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <select required value={formData.state}
                  onChange={e => update('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                  <option value="Indiana">Indiana</option>
                  <option value="Illinois">Illinois</option>
                  <option value="Ohio">Ohio</option>
                  <option value="Michigan">Michigan</option>
                  <option value="Kentucky">Kentucky</option>
                  <option value="Tennessee">Tennessee</option>
                  <option value="Texas">Texas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP *</label>
                <input type="text" required value={formData.zip}
                  onChange={e => update('zip', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="46204" pattern="[0-9]{5}" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
              <textarea rows={3} value={formData.description}
                onChange={e => update('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 resize-none"
                placeholder="Number of apprentice stations, hours of operation, relevant licenses..." />
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-4 rounded-lg font-bold transition disabled:opacity-50">
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
              ) : (
                <>Submit Application <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By submitting, you agree to be contacted by Elevate for Humanity regarding your partnership application.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
