'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Building2,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

const TOTAL_STEPS = 3;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

interface FormData {
  businessName: string;
  ein: string;
  businessAddress: string;
  city: string;
  state: string;
  zip: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  ptin: string;
  efin: string;
  preparerCount: string;
  acknowledgedSplit: boolean;
  acknowledgedAddons: boolean;
  acknowledgedSoftware: boolean;
  acknowledgedPayroll: boolean;
  acknowledgedPolicy: boolean;
}

const INITIAL: FormData = {
  businessName: '',
  ein: '',
  businessAddress: '',
  city: '',
  state: 'IN',
  zip: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  ptin: '',
  efin: '',
  preparerCount: '1',
  acknowledgedSplit: false,
  acknowledgedAddons: false,
  acknowledgedSoftware: false,
  acknowledgedPayroll: false,
  acknowledgedPolicy: false,
};

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { label: 'Business Info', Icon: Building2 },
    { label: 'Credentials', Icon: Upload },
    { label: 'Acknowledgments', Icon: CheckCircle },
  ];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map(({ label, Icon }, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  done
                    ? 'bg-brand-green-600 text-white'
                    : active
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  active ? 'text-brand-blue-700' : done ? 'text-brand-green-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mb-4 transition-colors ${
                  done ? 'bg-brand-green-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-sm text-red-600">{msg}</p>;
}

export default function SubofficeApplyPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.contactName.trim()) e.contactName = 'Contact name is required';
    if (!form.contactEmail.trim()) e.contactEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      e.contactEmail = 'Enter a valid email address';
    if (!form.contactPhone.trim()) e.contactPhone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.ptin.trim()) e.ptin = 'PTIN is required';
    else if (!/^P\d{8}$/i.test(form.ptin.trim()))
      e.ptin = 'PTIN format: P followed by 8 digits (e.g. P12345678)';
    if (!form.efin.trim()) e.efin = 'EFIN is required';
    else if (!/^\d{6}$/.test(form.efin.trim()))
      e.efin = 'EFIN must be exactly 6 digits';
    const count = parseInt(form.preparerCount, 10);
    if (isNaN(count) || count < 1) e.preparerCount = 'Enter at least 1 preparer';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3(): boolean {
    const allAcked =
      form.acknowledgedSplit &&
      form.acknowledgedAddons &&
      form.acknowledgedSoftware &&
      form.acknowledgedPayroll &&
      form.acknowledgedPolicy;
    if (!allAcked) {
      setSubmitError('You must check all acknowledgments before submitting.');
      return false;
    }
    setSubmitError('');
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep3()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/suboffice/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          preparerCount: parseInt(form.preparerCount, 10) || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      setApplicationId(data.id ?? '');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted</h1>
          <p className="text-lg text-slate-600 mb-2">
            Thank you, <strong>{form.contactName}</strong>.
          </p>
          <p className="text-slate-600 mb-6">
            We&apos;ve received your suboffice application for{' '}
            <strong>{form.businessName}</strong>. Our team will review your credentials and contact
            you at <strong>{form.contactEmail}</strong> within 2&ndash;3 business days.
          </p>
          {applicationId && (
            <p className="text-sm text-slate-400 mb-8">
              Reference ID: <code className="font-mono">{applicationId}</code>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/suboffice-onboarding"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Suboffice Onboarding
            </Link>
            <Link
              href="/"
              className="border border-slate-300 hover:border-slate-400 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Suboffice Onboarding', href: '/suboffice-onboarding' },
            { label: 'Apply' },
          ]}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Suboffice Application</h1>
          <p className="text-slate-600">
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>

        <StepIndicator current={step} />

        <form onSubmit={handleSubmit} noValidate>
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-blue-600" />
                Business Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Legal Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => set('businessName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="ABC Tax Services LLC"
                />
                <FieldError msg={errors.businessName} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  EIN / FEIN
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.ein}
                  onChange={(e) => set('ein', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Business Address
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.businessAddress}
                  onChange={(e) => set('businessAddress', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    placeholder="Indianapolis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-1/2">
                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => set('zip', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="46201"
                  maxLength={10}
                />
              </div>

              <hr className="border-slate-200" />
              <h3 className="text-lg font-semibold text-slate-800">Primary Contact</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="Jane Smith"
                />
                <FieldError msg={errors.contactName} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="jane@example.com"
                />
                <FieldError msg={errors.contactEmail} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="(317) 555-0100"
                />
                <FieldError msg={errors.contactPhone} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-blue-600" />
                IRS Credentials
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Why we need this</p>
                <p>
                  The IRS requires all paid tax preparers to have a PTIN. Your EFIN authorizes
                  electronic filing. Both are verified before activation.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  PTIN (Preparer Tax Identification Number) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ptin}
                  onChange={(e) => set('ptin', e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-mono"
                  placeholder="P12345678"
                  maxLength={9}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Format: P followed by 8 digits. Obtain a PTIN through your preparer registration
                  before submitting this application.
                </p>
                <FieldError msg={errors.ptin} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  EFIN (Electronic Filing Identification Number) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.efin}
                  onChange={(e) => set('efin', e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-mono"
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-slate-500">
                  6-digit electronic filing identification number issued to authorized e-file
                  providers. Enter the EFIN already assigned to your organization.
                </p>
                <FieldError msg={errors.efin} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Number of Tax Preparers <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.preparerCount}
                  onChange={(e) => set('preparerCount', e.target.value)}
                  className="w-32 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Each preparer must have their own PTIN. You can add them after activation.
                </p>
                <FieldError msg={errors.preparerCount} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-blue-600" />
                Required Acknowledgments
              </h2>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Read each item carefully. All five must be checked before you can submit.</p>
              </div>

              {([
                {
                  field: 'acknowledgedSplit' as const,
                  label: 'Revenue share 40/60',
                  text: 'I understand revenue is shared 40/60 — main office receives 40%, suboffice keeps 60% of the base tax preparation fee. Payments are released only after the IRS releases the client\'s refund to the main office.',
                },
                {
                  field: 'acknowledgedAddons' as const,
                  label: 'Add-on fees to main office',
                  text: 'I understand all add-on fees go to the main office — this includes refund advances, prepaid cards, bank products, and any other ancillary fees.',
                },
                {
                  field: 'acknowledgedSoftware' as const,
                  label: 'Software included at no cost',
                  text: 'I understand software, training, and support are included with no additional monthly fees charged to the suboffice.',
                },
                {
                  field: 'acknowledgedPayroll' as const,
                  label: 'Payroll held until IRS release',
                  text: 'I understand payroll and commissions cannot be processed until the IRS has processed and released each client\'s refund.',
                },
                {
                  field: 'acknowledgedPolicy' as const,
                  label: 'Payout policy reviewed',
                  text: 'I have reviewed the complete payout policy and billing schedule available at /suboffice-onboarding.',
                },
              ] as { field: keyof FormData; label: string; text: string }[]).map(({ field, label, text }) => (
                <label
                  key={field}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    form[field]
                      ? 'border-brand-green-400 bg-brand-green-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[field] as boolean}
                    onChange={(e) => set(field, e.target.checked)}
                    className="mt-0.5 w-5 h-5 flex-shrink-0 accent-green-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">{label}</p>
                    <p className="text-sm text-slate-600">{text}</p>
                  </div>
                </label>
              ))}

              {submitError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{submitError}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <Link
                href="/suboffice-onboarding"
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                Cancel
              </Link>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting&hellip;
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
