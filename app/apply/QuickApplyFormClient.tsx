'use client';
import Turnstile from '@/components/Turnstile';

import React from 'react';
// app/apply/QuickApplyFormClient.tsx

import { useState } from 'react';
import { Loader2, ArrowRight, Calendar } from 'lucide-react';

type ProgramOption =
  | 'barber'
  | 'cna'

  | 'hvac'
  | 'cdl'
  | 'building-technician'
  | 'tax-finance'
  | 'business-startup'
  | 'other';

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  zip: string;
  program: ProgramOption | '';
  hasCaseManager: 'yes' | 'no' | '';
  caseManagerAgency: string;
  supportNeeds: string;
  preferredContact: 'call' | 'text' | 'email' | '';
}

const initialState: FormState = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  city: '',
  zip: '',
  program: '',
  hasCaseManager: '',
  caseManagerAgency: '',
  supportNeeds: '',
  preferredContact: '',
};

export default function QuickApplyFormClient() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'Please enter your first name.';
    if (!form.lastName.trim()) return 'Please enter your last name.';
    if (!form.phone.trim()) return 'Please enter a phone number.';
    if (!form.email.trim()) return 'Please enter an email address.';
    if (!form.city.trim()) return 'Please enter your city.';
    if (!form.zip.trim()) return 'Please enter your ZIP code.';
    if (!form.program)
      return 'Please choose the program you are most interested in.';
    if (!form.preferredContact)
      return 'Please choose how you prefer to be contacted.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    try {
      // Send as simple inquiry via email
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          program: form.program,
          message: `Full Application Submission:
City: ${form.city}
ZIP: ${form.zip}
Has Case Manager: ${form.hasCaseManager}
${form.caseManagerAgency ? `Agency: ${form.caseManagerAgency}` : ''}
${form.supportNeeds ? `Support Needs: ${form.supportNeeds}` : ''}
Preferred Contact: ${form.preferredContact}`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      // Redirect to success page with application details
      if (data.id) {
        const params = new URLSearchParams({
          id: data.id,
          email: data.email || form.email,
        });
        if (data.program) {
          params.append('program', data.program);
        }
        window.location.href = `/apply/success?${params.toString()}`;
      } else {
        // Fallback to inline success
        const refNumber =
          data.referenceNumber ||
          `EFH-${Date.now().toString(36).toUpperCase()}`;
        setReferenceNumber(refNumber);

        setSuccessMessage(
          'Thank you! Your application has been received. Someone from Elevate for Humanity will contact you within 1–2 business days.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        ('Operation failed') ||
          "We're having a temporary issue submitting this form. Please call support center or use the Quick Inquiry form while we fix this."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // If successfully submitted, show success screen
  if (successMessage && referenceNumber) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h2 className="text-3xl font-bold text-black mb-3">
            Application Received!
          </h2>
          <p className="text-lg text-black mb-6">
            Thank you for applying! We've received your application and sent a
            confirmation to <strong>{form.email}</strong>.
          </p>

          {/* Reference Number */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mb-6 max-w-md mx-auto">
            <p className="text-sm text-black mb-2">
              Your Reference Number:
            </p>
            <p className="text-2xl font-bold text-black font-mono">
              {referenceNumber}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Save this number to check your application status
            </p>
          </div>

          {/* What's Next */}
          <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-xl p-6 mb-6 text-left max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-black mb-4">
              What Happens Next?
            </h3>
            <ol className="space-y-3 text-black">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>
                  We review your application and check funding eligibility
                  (WIOA, WRG, JRI)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span>
                  An advisor will contact you within 1-2 business days via{' '}
                  {form.preferredContact}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span>
                  We'll discuss your goals, program details, and next steps
                </span>
              </li>
            </ol>
          </div>

          {/* Calendly CTA */}
          <div className="bg-brand-orange-50 border-2 border-brand-orange-200 rounded-xl p-6 mb-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-black mb-2">
              Want to Talk Sooner?
            </h3>
            <p className="text-black mb-4">
              Schedule your advisor get started instead of waiting for us to reach
              out.
            </p>
            <a
              href="https://calendly.com/elevate-for-humanity/advisor-call"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 transition shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              Schedule Get Started
            </a>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setSuccessMessage(null);
                setReferenceNumber(null);
                setForm(initialState);
              }}
              className="px-6 py-3 bg-slate-100 text-black font-semibold rounded-lg hover:bg-slate-200 transition"
            >
              Submit Another Application
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
            >
              Return to Home
            </a>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-black">
              Questions? Contact us at{' '}
              <a
                href="/support"
                className="font-bold text-brand-orange-600 hover:text-brand-orange-700"
              >
                Get Help Online
              </a>{' '}
              or email{' '}
              <a
                href="/contact"
                className="font-bold text-brand-orange-600 hover:text-brand-orange-700"
              >
                our contact form
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-brand-red-200 bg-brand-red-50 px-4 py-3 text-sm text-brand-red-800">
          {errorMessage}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            First Name *
          </label>
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Last Name *
          </label>
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Phone Number *
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Email *
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            City *
          </label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            ZIP Code *
          </label>
          <input
            name="zip"
            value={form.zip}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-black mb-1">
          Program you&apos;re most interested in *
        </label>
        <select
          name="program"
          value={form.program}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Select a program</option>
          <option value="barber">Barber Apprenticeship</option>
          <option value="cna">CNA / Healthcare</option>

          <option value="hvac">HVAC / Building Trades</option>
          <option value="cdl">CDL / Transportation</option>
          <option value="building-technician">Building Technician</option>
          <option value="tax-finance">Tax &amp; Finance</option>
          <option value="business-startup">Business Startup</option>
          <option value="other">I&apos;m not sure / Other</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Do you have a case manager? *
          </label>
          <select
            name="hasCaseManager"
            value={form.hasCaseManager}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select one</option>
            <option value="yes">Yes, I have a case manager</option>
            <option value="no">No, I do not</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            If yes, what agency? (WorkOne, probation, housing, etc.)
          </label>
          <input
            name="caseManagerAgency"
            value={form.caseManagerAgency}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-black mb-1">
          Anything we should know to better support you? (Optional)
        </label>
        <p className="text-[11px] text-slate-500 mb-1">
          For example: justice involvement, housing needs, childcare,
          transportation, returning home, mental health, or anything else.
        </p>
        <textarea
          name="supportNeeds"
          value={form.supportNeeds}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-black mb-1">
          How do you prefer we contact you? *
        </label>
        <div className="flex flex-wrap gap-3 mt-1">
          {['call', 'text', 'email'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  preferredContact: method as FormState['preferredContact'],
                }))
              }
              className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold border transition ${
                form.preferredContact === method
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-black hover:bg-slate-50'
              }`}
            >
              {method === 'call'
                ? 'Phone Call'
                : method === 'text'
                  ? 'Text Message'
                  : 'Email'}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-orange-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-brand-orange-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Application...
            </>
          ) : (
            <>
              Submit My Application
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="mt-3 text-xs text-black">
          By submitting, you agree that Elevate for Humanity may contact you
          about programs, funding, and support services. We do not sell your
          information.
        </p>
      </div>
    </form>
  );
}
