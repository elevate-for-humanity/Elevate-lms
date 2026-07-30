'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const PROGRAMS = [
  { slug: 'medical-assistant', name: 'Medical Assistant' },
  { slug: 'phlebotomy', name: 'Phlebotomy Technician' },
  { slug: 'hvac-technician', name: 'HVAC Technician' },
  { slug: 'barber', name: 'Barber Apprenticeship' },
  { slug: 'cosmetology', name: 'Cosmetology' },
  { slug: 'cna', name: 'Certified Nursing Assistant' },
  { slug: 'act-workkeys', name: 'ACT WorkKeys' },
  { slug: 'epa-608', name: 'EPA 608 Certification' },
];

const FUNDING_OPTIONS = [
  { value: 'self', label: 'Self-Pay', desc: 'BNPL financing available — $0 deposit' },
  { value: 'wioa', label: 'WIOA', desc: 'Workforce Innovation and Opportunity Act' },
  { value: 'snap', label: 'SNAP E&T', desc: 'Supplemental Nutrition Assistance Program' },
  { value: 'next_level_jobs', label: 'Next Level Jobs', desc: 'Indiana Next Level Jobs program' },
  { value: 'employer', label: 'Employer Sponsorship', desc: 'Your employer is covering costs' },
  { value: 'other', label: 'Other / Unsure', desc: 'Let\'s explore options together' },
];

export default function EnrollmentApplyPage() {
  const searchParams = useSearchParams();
  const initialProgram = searchParams.get('program') || '';

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    programSlug: initialProgram,
    programName: PROGRAMS.find(p => p.slug === initialProgram)?.name || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    addressLine1: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    fundingSource: '',
    highSchoolDiploma: '',
    workExperience: '',
    criminalBackground: '',
    goals: '',
    howHeard: '',
  });

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'programSlug') {
      const prog = PROGRAMS.find(p => p.slug === value);
      setFormData(prev => ({ ...prev, programSlug: value, programName: prog?.name || '' }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/enrollment-v2/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setConfirmation(data.confirmation_number || data.application_id);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Application Received!</h1>
          <p className="text-slate-600 mb-2">Your application has been submitted successfully.</p>
          {confirmation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-600 mb-1">Confirmation Number</p>
              <p className="text-2xl font-mono font-bold text-blue-700">{confirmation}</p>
            </div>
          )}
          <div className="space-y-3 text-left bg-slate-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold">What happens next?</h3>
            <div className="flex gap-3 text-sm">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
              <p className="text-slate-600">Paris AI will review your application and determine funding eligibility — same day.</p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
              <p className="text-slate-600">You&apos;ll receive an email with next steps — upload documents and sign your enrollment agreement.</p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
              <p className="text-slate-600">Once approved, access your student portal and start orientation.</p>
            </div>
          </div>
          <Link href="/enrollment-v2/documents" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Upload Documents <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/enrollment-v2/program" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Programs
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-3xl font-bold">Apply — Enrollment V2</h1>
          </div>
          <p className="text-slate-300">Powered by Paris AI. Takes about 5 minutes.</p>

          {/* Progress */}
          <div className="flex gap-2 mt-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-blue-500' : 'bg-slate-700'}`} />
            ))}
          </div>
          <p className="text-sm text-slate-400 mt-2">Step {step} of 3 — {step === 1 ? 'Program & Funding' : step === 2 ? 'Personal Information' : 'Goals & Review'}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1: Program & Funding */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block font-bold mb-2">Which program are you applying for? *</label>
                <select
                  value={formData.programSlug}
                  onChange={e => update('programSlug', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select a program...</option>
                  {PROGRAMS.map(p => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-3">How do you plan to pay? *</label>
                <div className="grid gap-3">
                  {FUNDING_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.fundingSource === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="funding"
                        value={opt.value}
                        checked={formData.fundingSource === opt.value}
                        onChange={e => update('fundingSource', e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-bold">{opt.label}</p>
                        <p className="text-sm text-slate-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData.fundingSource && formData.fundingSource !== 'self' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-sm font-bold text-green-800">Funding option selected!</p>
                  <p className="text-sm text-green-700">We&apos;ll verify your eligibility before enrollment. No payment needed upfront.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">First Name *</label>
                  <input type="text" value={formData.firstName} onChange={e => update('firstName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={e => update('lastName', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" required />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Email Address *</label>
                  <input type="email" value={formData.email} onChange={e => update('email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Phone Number *</label>
                  <input type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Date of Birth *</label>
                <input type="date" value={formData.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Street Address</label>
                <input type="text" value={formData.addressLine1} onChange={e => update('addressLine1', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-1">City</label>
                  <input type="text" value={formData.addressCity} onChange={e => update('addressCity', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">State</label>
                  <input type="text" value={formData.addressState} onChange={e => update('addressState', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">ZIP Code</label>
                <input type="text" value={formData.addressZip} onChange={e => update('addressZip', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Do you have a high school diploma or GED? *</label>
                <select value={formData.highSchoolDiploma} onChange={e => update('highSchoolDiploma', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none" required>
                  <option value="">Select...</option>
                  <option value="diploma">Yes — High School Diploma</option>
                  <option value="ged">Yes — GED</option>
                  <option value="in_progress">Currently Working on It</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Submit */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-1">What are your career goals?</label>
                <textarea value={formData.goals} onChange={e => update('goals', e.target.value)} rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="I want to become a licensed barber and eventually own my own shop..." />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">How did you hear about Elevate?</label>
                <select value={formData.howHeard} onChange={e => update('howHeard', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none">
                  <option value="">Select...</option>
                  <option value="google">Google Search</option>
                  <option value="facebook">Facebook</option>
                  <option value="friend">Friend / Family</option>
                  <option value="employer">Employer</option>
                  <option value="workforce">Workforce Agency</option>
                  <option value="indeed">Indeed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-bold mb-2">Application Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-500">Program:</span> <span className="font-medium">{formData.programName || 'Not selected'}</span></div>
                  <div><span className="text-slate-500">Funding:</span> <span className="font-medium">{FUNDING_OPTIONS.find(f => f.value === formData.fundingSource)?.label || 'Not selected'}</span></div>
                  <div><span className="text-slate-500">Name:</span> <span className="font-medium">{formData.firstName} {formData.lastName}</span></div>
                  <div><span className="text-slate-500">Email:</span> <span className="font-medium">{formData.email || 'Not provided'}</span></div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <p className="text-xs text-slate-500">
                By submitting, you agree to Elevate&apos;s Terms of Service and Privacy Policy. We&apos;ll send application updates to your email.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 3 && (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle className="w-4 h-4" /> Submit Application</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
