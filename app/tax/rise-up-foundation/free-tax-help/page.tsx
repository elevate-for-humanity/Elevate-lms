'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';
const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';
const CALENDLY_LINK = 'https://calendly.com/elevateforhumanity/free-tax-prep';




export default function FreeTaxHelpPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('tax_returns').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = CALENDLY_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openCalendly = () => {
    if (typeof window !== 'undefined' && (window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({ url: CALENDLY_LINK });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Free Tax Help" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax/rise-up-foundation"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Rise Up Foundation
        </Link>
      </div>

      <h1 className="text-4xl font-bold">Free Tax Help</h1>
      <p className="mt-3 text-lg text-black mb-6">
        Get your taxes done for free by IRS-certified volunteers through the
        VITA program.
      </p>

      {/* Calendly Booking Button */}
      <div className="mb-8">
        <button
          onClick={openCalendly}
          className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Schedule Free Tax Appointment (Video or Phone)
        </button>
        <p className="text-sm text-black text-center mt-2">
          Funded • IRS-Certified Volunteers • Video or Phone Available
        </p>
      </div>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Who Qualifies?</h2>
        <p className="text-black mb-4">
          The VITA program provides free tax help to people who generally make
          $64,000 or less, persons with disabilities, and limited
          English-speaking taxpayers who need assistance in preparing their own
          tax returns.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">•</span>
            <div>
              <div className="font-semibold">Income Limit</div>
              <div className="text-sm text-black">
                Generally $64,000 or less per year
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">•</span>
            <div>
              <div className="font-semibold">Persons with Disabilities</div>
              <div className="text-sm text-black">
                Regardless of income level
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">•</span>
            <div>
              <div className="font-semibold">Limited English Speakers</div>
              <div className="text-sm text-black">
                We provide assistance in multiple languages
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">What to Bring</h2>
        <p className="text-black mb-6">
          To prepare your tax return, please bring the following documents:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Identification</h3>
            <ul className="list-disc pl-5 space-y-1 text-black">
              <li>
                Government-issued photo ID (driver's license, state ID,
                passport)
              </li>
              <li>
                Social Security cards or ITIN letters for everyone on the return
              </li>
              <li>Birth dates for everyone on the return</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Income Documents</h3>
            <ul className="list-disc pl-5 space-y-1 text-black">
              <li>W-2 forms from all employers</li>
              <li>
                1099 forms (interest, dividends, retirement, unemployment, etc.)
              </li>
              <li>Other income statements</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Deduction Documents (if applicable)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-black">
              <li>Childcare provider information (name, address, tax ID)</li>
              <li>Form 1098-T for education expenses</li>
              <li>Form 1098 for mortgage interest</li>
              <li>Receipts for charitable donations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Other</h3>
            <ul className="list-disc pl-5 space-y-1 text-black">
              <li>Copy of last year's tax return (if available)</li>
              <li>Bank account and routing numbers for direct deposit</li>
              <li>Health insurance information (Form 1095-A, B, or C)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">How to Schedule</h2>
        <p className="text-black mb-6">
          Schedule your VITA tax preparation appointment to ensure we can give
          you the time and attention you deserve.
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <div className="font-semibold">Call to Schedule</div>
              <div className="text-sm text-black">
                Call support center to book your appointment
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <div className="font-semibold">Gather Documents</div>
              <div className="text-sm text-black">
                Collect all required documents listed above
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <div className="font-semibold">Attend Appointment</div>
              <div className="text-sm text-black">
                Meet with our volunteer at your scheduled time
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <div className="font-semibold">File for Free</div>
              <div className="text-sm text-black">
                We'll prepare and e-file your return at no cost
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/support"
            className="px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-brand-green-700 transition"
          >
            Call support center
          </a>
          <Link
            href="/tax/rise-up-foundation/documents"
            className="px-6 py-3 rounded-lg border-2 border-brand-green-600 text-brand-green-600 font-semibold hover:bg-brand-green-50 transition"
          >
            View Document Checklist
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6">
        <h3 className="font-semibold text-black">Reference</h3>
        <p className="mt-2 text-sm text-black">
          For more information about the VITA program, visit the{' '}
          <a
            href="https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue-600 hover:underline"
          >
            IRS VITA overview page
          </a>
          .
        </p>
      </section>
    </div>
  );
}
