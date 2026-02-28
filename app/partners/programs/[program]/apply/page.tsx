'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getProgramConfig, type ProgramConfig } from '@/lib/partners/program-config';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu/30min';

export default function UniversalPartnerApplyPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.program as string;
  const config = getProgramConfig(slug);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Universal fields
  const [formData, setFormData] = useState({
    businessLegalName: '',
    dba: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    addressLine1: '',
    city: '',
    state: 'Indiana',
    zip: '',
    website: '',
    yearsInBusiness: '',
    numberOfEmployees: '',
    compensationModel: '',
    positionsAvailable: '1',
    // Program-specific fields stored as dynamic object
    programFields: {} as Record<string, string>,
    agreeToTerms: false,
    agreeToSiteVisit: false,
    agreeToWorkersComp: false,
  });

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Program Not Found</h1>
          <p className="text-gray-600 mb-6">The program you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/partners" className="text-orange-600 hover:text-orange-700 font-medium">
            View All Partner Programs →
          </Link>
        </div>
      </div>
    );
  }

  const totalSteps = 4;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('pf_')) {
      const fieldName = name.replace('pf_', '');
      setFormData(prev => ({
        ...prev,
        programFields: { ...prev.programFields, [fieldName]: value },
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/partners/${slug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          program: slug,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      router.push(`/partners/programs/${slug}/thank-you`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-gray-900';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  const renderProgramField = (field: typeof config.programFields[0]) => {
    const value = formData.programFields[field.name] || '';
    if (field.type === 'select' && field.options) {
      return (
        <div key={field.name}>
          <label htmlFor={`pf_${field.name}`} className={labelClass}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select id={`pf_${field.name}`} name={`pf_${field.name}`} value={value} onChange={handleChange} required={field.required} className={inputClass}>
            <option value="">Select...</option>
            {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={field.name}>
          <label htmlFor={`pf_${field.name}`} className={labelClass}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea id={`pf_${field.name}`} name={`pf_${field.name}`} value={value} onChange={handleChange} required={field.required} className={inputClass} rows={3} placeholder={field.placeholder} />
        </div>
      );
    }
    return (
      <div key={field.name}>
        <label htmlFor={`pf_${field.name}`} className={labelClass}>
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          id={`pf_${field.name}`}
          name={`pf_${field.name}`}
          value={value}
          onChange={handleChange}
          required={field.required}
          className={inputClass}
          placeholder={field.placeholder}
        />
        {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners' },
          { label: config.shortName, href: `/partners/programs/${slug}` },
          { label: 'Apply' },
        ]} />
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.shortName} Partner Application</h1>
          <p className="text-gray-600">Become a partner {config.siteLabel} for the {config.name} program.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i + 1 <= step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{i + 1}</div>
              {i < totalSteps - 1 && <div className={`w-12 h-1 rounded ${i + 1 < step ? 'bg-orange-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {/* Step 1: Business Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>
                <div>
                  <label htmlFor="businessLegalName" className={labelClass}>Legal Business Name <span className="text-red-500">*</span></label>
                  <input type="text" id="businessLegalName" name="businessLegalName" value={formData.businessLegalName} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="dba" className={labelClass}>DBA / Trade Name (if different)</label>
                  <input type="text" id="dba" name="dba" value={formData.dba} onChange={handleChange} className={inputClass} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactName" className={labelClass}>Contact Name <span className="text-red-500">*</span></label>
                    <input type="text" id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className={labelClass}>Email <span className="text-red-500">*</span></label>
                    <input type="email" id="contactEmail" name="contactEmail" value={formData.contactEmail} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactPhone" className={labelClass}>Phone <span className="text-red-500">*</span></label>
                    <input type="tel" id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="website" className={labelClass}>Website</label>
                    <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} className={inputClass} placeholder="https://" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{config.siteLabel.charAt(0).toUpperCase() + config.siteLabel.slice(1)} Location</h2>
                <div>
                  <label htmlFor="addressLine1" className={labelClass}>Street Address <span className="text-red-500">*</span></label>
                  <input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required className={inputClass} />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className={labelClass}>City <span className="text-red-500">*</span></label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelClass}>State <span className="text-red-500">*</span></label>
                    <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="zip" className={labelClass}>ZIP <span className="text-red-500">*</span></label>
                    <input type="text" id="zip" name="zip" value={formData.zip} onChange={handleChange} required className={inputClass} pattern="[0-9]{5}" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="yearsInBusiness" className={labelClass}>Years in Business</label>
                    <input type="number" id="yearsInBusiness" name="yearsInBusiness" value={formData.yearsInBusiness} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="numberOfEmployees" className={labelClass}>Number of Employees</label>
                    <input type="number" id="numberOfEmployees" name="numberOfEmployees" value={formData.numberOfEmployees} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Program-Specific */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{config.shortName} Details</h2>
                {config.programFields.map(renderProgramField)}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="compensationModel" className={labelClass}>Compensation Model <span className="text-red-500">*</span></label>
                    <select id="compensationModel" name="compensationModel" value={formData.compensationModel} onChange={handleChange} required className={inputClass}>
                      <option value="">Select...</option>
                      {config.compensationModels.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="positionsAvailable" className={labelClass}>Positions Available <span className="text-red-500">*</span></label>
                    <input type="number" id="positionsAvailable" name="positionsAvailable" value={formData.positionsAvailable} onChange={handleChange} required min="1" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Agreements */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Review &amp; Submit</h2>

                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                  <p><strong>Business:</strong> {formData.businessLegalName} {formData.dba ? `(DBA: ${formData.dba})` : ''}</p>
                  <p><strong>Contact:</strong> {formData.contactName} — {formData.contactEmail} — {formData.contactPhone}</p>
                  <p><strong>Location:</strong> {formData.addressLine1}, {formData.city}, {formData.state} {formData.zip}</p>
                  <p><strong>Program:</strong> {config.name}</p>
                  <p><strong>Positions:</strong> {formData.positionsAvailable}</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} required className="mt-1 w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">I agree to the <Link href="/legal/agreements" className="text-orange-600 underline" target="_blank">Partner Terms &amp; Conditions</Link> and the Memorandum of Understanding.</span>
                  </label>
                  {config.siteVisitRequired && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" name="agreeToSiteVisit" checked={formData.agreeToSiteVisit} onChange={handleChange} required className="mt-1 w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-700">I agree to complete a video site visit (via Zoom) before final approval.</span>
                    </label>
                  )}
                  {config.workersCompRequired && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" name="agreeToWorkersComp" checked={formData.agreeToWorkersComp} onChange={handleChange} required className="mt-1 w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-700">I acknowledge that workers&apos; compensation insurance is required for {config.traineeLabelPlural}.</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium">
                  Back
                </button>
              ) : (
                <Link href={`/partners/programs/${slug}`} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium inline-flex items-center">
                  Cancel
                </Link>
              )}
              {step < totalSteps ? (
                <button type="button" onClick={() => setStep(s => s + 1)} className="px-8 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
