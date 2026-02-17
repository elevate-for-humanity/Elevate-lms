'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const plans: Record<string, {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  interval: string;
  description: string;
  image: string;
}> = {
  core: {
    id: 'core',
    name: 'Core Workforce Infrastructure',
    price: 750,
    priceDisplay: '$750',
    interval: 'month',
    description: 'For solo operators, small nonprofits, and pilot programs.',
    image: '/images/programs-hq/students-learning.jpg',
  },
  institutional: {
    id: 'institutional',
    name: 'Institutional Operator',
    price: 2500,
    priceDisplay: '$2,500',
    interval: 'month',
    description: 'For schools, training providers, and nonprofits running multiple programs.',
    image: '/images/programs-hq/business-office.jpg',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Workforce Infrastructure',
    price: 8500,
    priceDisplay: '$8,500',
    interval: 'month',
    description: 'For workforce boards, government agencies, and regional operators.',
    image: '/images/heroes-hq/employer-hero.jpg',
  },
};

const organizationTypes = [
  { value: 'workforce_board', label: 'Workforce Development Board' },
  { value: 'nonprofit', label: 'Nonprofit / Community Organization' },
  { value: 'training_provider', label: 'Training Provider / School' },
  { value: 'apprenticeship_sponsor', label: 'Apprenticeship Sponsor' },
  { value: 'government', label: 'Government / Public Agency' },
  { value: 'employer', label: 'Employer' },
  { value: 'other', label: 'Other' },
];

export default function LicenseCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan') || 'institutional';
  const plan = plans[planId] || plans.institutional;

  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    contactName: '',
    contactEmail: '',
    phone: '',
  });
  const [agreements, setAgreements] = useState({
    eula: false,
    tos: false,
    aup: false,
    disclosures: false,
    license: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAgreementsAccepted = Object.values(agreements).every(v => v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allAgreementsAccepted) {
      setError('You must accept all agreements to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/license/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          organizationName: formData.organizationName,
          organizationType: formData.organizationType,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          agreementsAccepted: Object.entries(agreements)
            .filter(([_, accepted]) => accepted)
            .map(([key]) => key),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'License', href: '/license' },
            { label: 'Pricing', href: '/license/pricing' },
            { label: 'Checkout' }
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
              
              <div className="relative h-32 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={plan.image}
                  alt={plan.name}
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-600 mb-4">{plan.description}</p>

              <div className="border-t pt-4">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-slate-600">Monthly subscription</span>
                  <span className="text-2xl font-bold text-slate-900">{plan.priceDisplay}</span>
                </div>
                <p className="text-sm text-slate-500">Billed monthly. Cancel anytime.</p>
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  14-day free trial included
                </p>
                <p className="text-xs text-green-700 mt-1">
                  You won't be charged until your trial ends.
                </p>
              </div>

              <div className="mt-4">
                <Link
                  href="/license/pricing"
                  className="text-sm text-blue-600 hover:underline"
                >
                  ← Change plan
                </Link>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-6">Complete Your Purchase</h1>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Organization Info */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your Organization"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Organization Type *
                      </label>
                      <select
                        required
                        value={formData.organizationType}
                        onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select type...</option>
                        {organizationTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="you@organization.org"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(555) 555-5555"
                      />
                    </div>
                  </div>
                </div>

                {/* Agreements */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Agreements</h2>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.tos}
                        onChange={(e) => setAgreements({ ...agreements, tos: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        I agree to the <Link href="/terms-of-service" className="text-blue-600 hover:underline" target="_blank">Terms of Service</Link>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.eula}
                        onChange={(e) => setAgreements({ ...agreements, eula: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        I agree to the <Link href="/eula" className="text-blue-600 hover:underline" target="_blank">End User License Agreement</Link>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.aup}
                        onChange={(e) => setAgreements({ ...agreements, aup: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        I agree to the <Link href="/acceptable-use-policy" className="text-blue-600 hover:underline" target="_blank">Acceptable Use Policy</Link>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.disclosures}
                        onChange={(e) => setAgreements({ ...agreements, disclosures: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        I acknowledge the <Link href="/disclosures" className="text-blue-600 hover:underline" target="_blank">Platform Disclosures</Link>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.license}
                        onChange={(e) => setAgreements({ ...agreements, license: e.target.checked })}
                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        I agree to the <Link href="/license-agreement" className="text-blue-600 hover:underline" target="_blank">License Agreement</Link>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !allAgreementsAccepted}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Redirecting to Stripe...' : `Continue to Payment - ${plan.priceDisplay}/mo`}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  You will be redirected to Stripe to complete your purchase securely.
                  Your 14-day free trial starts immediately.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
