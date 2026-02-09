'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ModernLandingHero from '@/components/landing/ModernLandingHero';
import Turnstile from '@/components/Turnstile';

function InquiryForm() {
  const searchParams = useSearchParams();
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    const programParam = searchParams.get('program');
    if (programParam) {
      const programMap: Record<string, string> = {
        'barber-apprenticeship': 'Barber Apprenticeship',
        'hvac-technician': 'HVAC Technician',
        'cna-certification': 'CNA (Certified Nursing Assistant)',
      };
      setSelectedProgram(programMap[programParam] || '');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError('Please complete the verification');
      return;
    }
    
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, turnstileToken }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/inquiry/success';
        }, 1000);
      } else {
        setError(result.error || 'Application failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      setError('An error occurred. Please try again or call 317-314-3757.');
      setLoading(false);
    }
  };

  return (
    <>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Inquiry" }]} />
      </div>
<ModernLandingHero
        badge="Limited Seats Available"
        headline="Start Your Career"
        accentText="In 10 Minutes"
        subheadline="Quick application. Fast response. Real results."
        description="Last year, 753 students were accepted and 89% got jobs after graduation. Average time from application to first paycheck: 67 days."
        imageSrc="/hero-images/apply-hero.jpg"
        imageAlt="Apply Now"
        primaryCTA={{ text: "Start Application", href: "#application" }}
        secondaryCTA={{ text: "Questions? Contact Us", href: "tel:317-314-3757" }}
        features={[
          "10-minute application with 2-3 day response",
          "Funded training through WIOA and state grants",
          "Job placement support and career counseling included"
        ]}
        imageOnRight={true}
      />
      <section id="application" className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-black mb-4">
          Start Your Application
        </h1>
        <p className="my-4 text-black">
          10–15 minutes. Response within 2–3 business days.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">• Application submitted successfully! Redirecting...</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white border border-slate-200 rounded-lg p-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-black mb-2"
            >
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              required
              id="name"
              name="name"
              placeholder="Full name"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email <span className="text-red-600">*</span>
            </label>
            <input
              required
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-black mb-2"
            >
              Phone <span className="text-red-600">*</span>
            </label>
            <input
              required
              id="phone"
              name="phone"
              placeholder="Phone"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="program"
              className="block text-sm font-medium text-black mb-2"
            >
              Program <span className="text-red-600">*</span>
            </label>
            <select
              required
              id="program"
              name="program"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select program...</option>
              <optgroup label="Healthcare">
                <option value="CNA (Certified Nursing Assistant)">CNA (Certified Nursing Assistant)</option>
                <option value="Medical Assistant">Medical Assistant</option>
                <option value="Home Health Aide">Home Health Aide</option>
                <option value="Phlebotomy">Phlebotomy</option>
              </optgroup>
              <optgroup label="Skilled Trades">
                <option value="HVAC Technician">HVAC Technician</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Building Maintenance">Building Maintenance</option>
                <option value="Construction">Construction</option>
              </optgroup>
              <optgroup label="Barber & Beauty">
                <option value="Barber Apprenticeship">Barber Apprenticeship</option>
                <option value="Cosmetology">Cosmetology</option>
                <option value="Esthetics">Esthetics</option>
              </optgroup>
              <optgroup label="Technology">
                <option value="IT Support">IT Support</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Web Development">Web Development</option>
              </optgroup>
              <optgroup label="Business">
                <option value="Accounting">Accounting</option>
                <option value="Business Management">Business Management</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
              </optgroup>
              <optgroup label="Transportation">
                <option value="CDL (Commercial Driver License)">CDL (Commercial Driver License)</option>
              </optgroup>
              <option value="Not Sure - Help Me Choose">Not Sure - Help Me Choose</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="funding"
              className="block text-sm font-medium text-black mb-2"
            >
              Funding <span className="text-red-600">*</span>
            </label>
            <select
              required
              id="funding"
              name="funding"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select funding...</option>
              <option value="WIOA / Next Level Jobs">WIOA / Next Level Jobs</option>
              <option value="Employer Sponsored">Employer Sponsored</option>
              <option value="Self Pay">Self Pay</option>
              <option value="Not Sure">Not Sure</option>
            </select>
          </div>

          <label className="text-sm flex gap-2 items-center">
            <input type="checkbox" required className="w-4 h-4" />
            <span>Consent to contact</span>
          </label>

          <Turnstile onVerify={setTurnstileToken} />

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full min-h-[44px] bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </section>
    </>
  );
}



export default function Inquiry() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <InquiryForm />
    </Suspense>
  );
}
