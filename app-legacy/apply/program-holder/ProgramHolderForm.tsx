'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitProgramHolderApplication } from '../actions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const BUSINESS_OWNER_TYPES = new Set(['business-owner', 'independent-contractor', 'sole-proprietor']);

export default function ProgramHolderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orgType, setOrgType] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // prevent double-submit
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      organizationName: formData.get('organizationName') as string,
      organizationType: formData.get('organizationType') as string,
      website: formData.get('website') as string,
      numberOfStudents: formData.get('numberOfStudents') as string,
      programsOffered: formData.get('programsOffered') as string,
      partnershipGoals: formData.get('partnershipGoals') as string,
      businessLicense: formData.get('businessLicense') as string | null,
      ein: formData.get('ein') as string | null,
      role: 'program_holder' as const,
    };

    let result;
    try {
      result = await submitProgramHolderApplication(data);
    } catch (err) {
      setError(`Something went wrong submitting your application. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
      setLoading(false);
      return;
    }

    if (result.success) {
      router.push(result.redirectTo!);
    } else {
      setError(result.error || `Submission failed. Please try again or call ${PLATFORM_DEFAULTS.supportPhone}.`);
      setLoading(false);
    }
  }

  const isBusinessOwner = BUSINESS_OWNER_TYPES.has(orgType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
      {error && (
        <div
          className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* What is a Program Holder — instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h2 className="text-base font-bold text-slate-900 mb-3">Who should apply here?</h2>
        <p className="text-sm text-slate-700 mb-4">
          A <strong>Program Holder</strong> is any business, organization, or individual that hosts
          apprentices or trainees through {PLATFORM_DEFAULTS.orgName}. This includes:
        </p>
        <ul className="space-y-2 mb-4">
          {[
            'Barbershops, salons, and cosmetology studios hosting apprentices',
            'Independent contractors and sole proprietors offering on-the-job training',
            'Small businesses sponsoring employees through a credential program',
            'Schools, nonprofits, and workforce agencies offering training programs',
            'Employers partnering with us to upskill their workforce',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-brand-blue-600 font-bold">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="bg-white border border-brand-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-brand-blue-800 mb-1">What happens after you apply</p>
          <ol className="space-y-1">
            {[
              'Our team reviews your application within 1–2 business days',
              'You receive an email with your portal login credentials',
              'Sign your MOU and upload required documents in the portal',
              'Your account is activated and you can begin hosting apprentices',
            ].map((step, i) => (
              <li key={i} className="text-sm text-slate-700">
                <span className="font-semibold text-brand-blue-700">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Contact Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-black mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-black mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Organization Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Organization Information</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="organizationType" className="block text-sm font-medium text-black mb-2">
              Organization Type *
            </label>
            <select
              id="organizationType"
              name="organizationType"
              required
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select type</option>
              <optgroup label="Business / Self-Employed">
                <option value="business-owner">Business Owner / Employer</option>
                <option value="independent-contractor">Independent Contractor / 1099</option>
                <option value="sole-proprietor">Sole Proprietor</option>
              </optgroup>
              <optgroup label="Organization">
                <option value="school">School / Educational Institution</option>
                <option value="nonprofit">Nonprofit Organization</option>
                <option value="workforce-board">Workforce Development Board</option>
                <option value="community-org">Community Organization</option>
                <option value="government">Government Agency</option>
                <option value="other">Other</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-black mb-2">
              {isBusinessOwner ? 'Business Name *' : 'Organization Name *'}
            </label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              required
              placeholder={isBusinessOwner ? 'e.g. Kountry Kutz Barbershop' : ''}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          {/* Business owner / independent contractor extra fields */}
          {isBusinessOwner && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
              <p className="text-sm font-semibold text-amber-800">
                Business verification (optional — speeds up approval)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="businessLicense" className="block text-sm font-medium text-black mb-2">
                    Business License Number
                  </label>
                  <input
                    type="text"
                    id="businessLicense"
                    name="businessLicense"
                    placeholder="State or local license #"
                    className="w-full min-h-[44px] px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="ein" className="block text-sm font-medium text-black mb-2">
                    EIN / Tax ID
                  </label>
                  <input
                    type="text"
                    id="ein"
                    name="ein"
                    placeholder="XX-XXXXXXX"
                    className="w-full min-h-[44px] px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
              <p className="text-xs text-amber-700">
                If you operate as a sole proprietor without an EIN, leave these blank. Your SSN is
                never required here.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-black mb-2">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              placeholder="https://"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="numberOfStudents" className="block text-sm font-medium text-black mb-2">
              {isBusinessOwner ? 'How many apprentices do you plan to host?' : 'Estimated Number of Students'}
            </label>
            <select
              id="numberOfStudents"
              name="numberOfStudents"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select range</option>
              <option value="1-5">{isBusinessOwner ? '1–5 apprentices' : '1–50 students'}</option>
              {!isBusinessOwner && <option value="1-50">1–50 students</option>}
              <option value="6-10">{isBusinessOwner ? '6–10 apprentices' : '51–100 students'}</option>
              {!isBusinessOwner && <option value="51-100">51–100 students</option>}
              {!isBusinessOwner && <option value="101-500">101–500 students</option>}
              {!isBusinessOwner && <option value="500+">500+ students</option>}
              {isBusinessOwner && <option value="11+">11 or more</option>}
            </select>
          </div>

          <div>
            <label htmlFor="programsOffered" className="block text-sm font-medium text-black mb-2">
              {isBusinessOwner ? 'What trade or skill will apprentices learn at your business?' : 'Programs Currently Offered'}
            </label>
            <textarea
              id="programsOffered"
              name="programsOffered"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder={
                isBusinessOwner
                  ? 'e.g. Barbering, cosmetology, HVAC installation, electrical work...'
                  : 'List the training programs you currently offer...'
              }
            />
          </div>

          <div>
            <label htmlFor="partnershipGoals" className="block text-sm font-medium text-black mb-2">
              {isBusinessOwner ? 'Why do you want to host apprentices?' : 'Partnership Goals'}
            </label>
            <textarea
              id="partnershipGoals"
              name="partnershipGoals"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder={
                isBusinessOwner
                  ? 'e.g. Grow my team, give back to the community, access trained talent...'
                  : 'What do you hope to achieve through this partnership?'
              }
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-h-[48px] px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[48px] px-6 py-3 bg-white border-2 border-slate-300 text-black font-semibold rounded-lg hover:border-slate-400 transition-colors"
        >
          Back
        </button>
      </div>
    </form>
  );
}
