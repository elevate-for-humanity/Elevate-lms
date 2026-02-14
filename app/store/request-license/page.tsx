'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, Loader2 } from 'lucide-react';

const organizationTypes = [
  { value: 'workforce_board', label: 'Workforce Development Board' },
  { value: 'nonprofit', label: 'Nonprofit / Community Organization' },
  { value: 'training_provider', label: 'Training Provider / School' },
  { value: 'apprenticeship_sponsor', label: 'Apprenticeship Sponsor / Administrator' },
  { value: 'government', label: 'Government / Public Agency' },
  { value: 'other', label: 'Other' },
];

const roles = [
  { value: 'executive', label: 'Executive / Director' },
  { value: 'program_manager', label: 'Program Manager' },
  { value: 'it_lead', label: 'IT / Technical Lead' },
  { value: 'procurement', label: 'Procurement / Purchasing' },
  { value: 'other', label: 'Other' },
];

const useCases = [
  { value: 'funded_training', label: 'Funded workforce training (WIOA / WRG / similar)' },
  { value: 'apprenticeship', label: 'Apprenticeship administration' },
  { value: 'ojt_internships', label: 'Employer-based OJT / internships' },
  { value: 'internal_programs', label: 'Internal workforce programs' },
  { value: 'resale', label: 'Platform licensing / resale' },
];

const geographicScopes = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'statewide', label: 'Statewide' },
  { value: 'multi_state', label: 'Multi-state' },
];

const timelines = [
  { value: 'immediate', label: 'Immediately (0–30 days)' },
  { value: '1_3_months', label: '1–3 months' },
  { value: '3_6_months', label: '3–6 months' },
  { value: 'evaluating', label: 'Just evaluating' },
];

const trialStatus = [
  { value: 'completed', label: 'Yes' },
  { value: 'planning', label: 'No, but we plan to' },
  { value: 'direct', label: 'No, requesting license directly' },
];

const technicalCapacity = [
  { value: 'yes', label: 'Yes' },
  { value: 'limited', label: 'Limited' },
  { value: 'no', label: 'No (would need support)' },
];

const licenseTiers: Record<string, string> = {
  implementation: 'Implementation License ($35,000 – $50,000)',
  annual: 'Implementation + Annual License ($60,000 – $90,000)',
  renewal: 'Annual License Renewal ($15,000 – $30,000)',
};

function RequestLicenseContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || '';

  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    role: '',
    useCases: [] as string[],
    geographicScope: '',
    timeline: '',
    trialCompleted: '',
    technicalCapacity: '',
    licenseTier: tier,
    additionalInfo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleUseCaseChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(value)
        ? prev.useCases.filter((v) => v !== value)
        : [...prev.useCases, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // In production, this would send to your CRM/email
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">
            License Request Received
          </h1>
          <p className="text-gray-600 mb-8">
            Thanks. We review license requests carefully. You'll hear from us within 2 business days.
          </p>
          <div className="bg-white rounded-xl p-6 shadow-sm text-left mb-8">
            <h2 className="font-bold text-gray-900 mb-4">What we'll discuss:</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Your specific use case and requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Deployment timeline and technical needs</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <span>License terms and pricing</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Optional services if needed</span>
              </li>
            </ul>
          </div>
          <Link
            href="/store"
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-4">
            Request a License
          </h1>
          <p className="text-lg text-gray-600">
            Elevate Workforce Platform
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
                Organization Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Type *
                </label>
                <select
                  required
                  value={formData.organizationType}
                  onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">Select...</option>
                  {organizationTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
                Contact Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="">Select...</option>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Use Case */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
                Use Case
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Use Case * (select all that apply)
                </label>
                <div className="space-y-2">
                  {useCases.map((useCase) => (
                    <label key={useCase.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.useCases.includes(useCase.value)}
                        onChange={() => handleUseCaseChange(useCase.value)}
                        className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                      />
                      <span className="text-gray-700">{useCase.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geographic Scope *
                  </label>
                  <select
                    required
                    value={formData.geographicScope}
                    onChange={(e) => setFormData({ ...formData, geographicScope: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="">Select...</option>
                    {geographicScopes.map((scope) => (
                      <option key={scope.value} value={scope.value}>{scope.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Launch Timeline *
                  </label>
                  <select
                    required
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="">Select...</option>
                    {timelines.map((timeline) => (
                      <option key={timeline.value} value={timeline.value}>{timeline.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Readiness */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
                Readiness
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Have you completed a platform trial? *
                  </label>
                  <select
                    required
                    value={formData.trialCompleted}
                    onChange={(e) => setFormData({ ...formData, trialCompleted: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="">Select...</option>
                    {trialStatus.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Do you have internal technical capacity? *
                  </label>
                  <select
                    required
                    value={formData.technicalCapacity}
                    onChange={(e) => setFormData({ ...formData, technicalCapacity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="">Select...</option>
                    {technicalCapacity.map((capacity) => (
                      <option key={capacity.value} value={capacity.value}>{capacity.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Tier Interest
                </label>
                <select
                  value={formData.licenseTier}
                  onChange={(e) => setFormData({ ...formData, licenseTier: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">Not sure yet</option>
                  {Object.entries(licenseTiers).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anything else we should know?
              </label>
              <textarea
                rows={4}
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Specific requirements, questions, or context..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-slate-900 py-4 rounded-lg font-bold text-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  Submit License Request
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              We review requests carefully and respond within 2 business days.
            </p>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Want to try before you buy?{' '}
            <Link href="/store/trial" className="text-green-600 font-medium hover:underline">
              Start a 14-day trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Request License" }]} />
      </div>
<Loader2 className="w-10 h-10 text-slate-600 animate-spin" />
    </div>
  );
}

export default function RequestLicensePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RequestLicenseContent />
    </Suspense>
  );
}
