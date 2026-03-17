'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import VITAPageHero from '@/components/supersonic/VITAPageHero';

const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';
const CALENDLY_LINK = 'https://calendly.com/elevateforhumanity/free-tax-prep';

const QUALIFIES = [
  { label: 'Income at or below $67,000', desc: 'Most individuals and families earning $67,000 or less per year qualify for free VITA preparation.', image: '/images/pages/finance-accounting.jpg' },
  { label: 'Persons with Disabilities', desc: 'Qualifying individuals with disabilities may be eligible regardless of income level.', image: '/images/pages/supersonic-page-6.jpg' },
  { label: 'Limited English Speakers', desc: 'VITA volunteers are available in multiple languages. Interpretation assistance is available at many sites.', image: '/images/pages/supersonic-page-7.jpg' },
  { label: 'Seniors', desc: 'The IRS Tax Counseling for the Elderly (TCE) program specifically serves taxpayers 60 and older.', image: '/images/pages/admin-tax-training-hero.jpg' },
];

const STEPS = [
  { number: '01', title: 'Schedule Your Appointment', desc: 'Book online via Calendly or call our support center. Video, phone, and in-person appointments are available.', image: '/images/pages/calendar-page-1.jpg' },
  { number: '02', title: 'Gather Your Documents', desc: 'Bring photo ID, Social Security cards, all W-2 and 1099 forms, last year\'s return, and bank account info for direct deposit.', image: '/images/pages/admin-documents-hero.jpg' },
  { number: '03', title: 'Meet With a Volunteer', desc: 'An IRS-certified volunteer reviews your documents, prepares your return, and walks you through it before filing.', image: '/images/pages/admin-tax-training-hero.jpg' },
  { number: '04', title: 'File for Free', desc: 'Your return is e-filed at no cost. Refund arrives in 10–21 days via direct deposit. No fees. No upsells.', image: '/images/pages/admin-tax-filing-hero.jpg' },
];

export default function FreeTaxHelpPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = CALENDLY_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const openCalendly = () => {
    if (typeof window !== 'undefined' && (window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({ url: CALENDLY_LINK });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <VITAPageHero
        image="/images/pages/subpage-tax-hero.jpg"
        alt="Free VITA tax preparation through Rise Up Foundation"
        title="Free Tax Preparation"
        subtitle="IRS-certified volunteers prepare your complete federal and state return at no cost. No hidden fees. No upsells."
      />

      {/* BOOK CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={openCalendly}
              className="rounded-2xl overflow-hidden border-2 border-emerald-700 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="relative h-44">
                <Image src="/images/pages/calendar-page-1.jpg" alt="Schedule appointment" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-5 bg-emerald-700">
                <p className="font-black text-white text-lg">Schedule Free Appointment</p>
                <p className="text-emerald-100 text-sm mt-1">Video, phone, or in-person</p>
              </div>
            </button>
            <Link href="/tax/rise-up-foundation/site-locator" className="rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 group">
              <div className="relative h-44">
                <Image src="/images/pages/locations-page-1.jpg" alt="Find a VITA site" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-5 bg-white">
                <p className="font-black text-slate-900 text-lg">Find a Walk-In Site</p>
                <p className="text-slate-500 text-sm mt-1">Indianapolis and surrounding areas</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* WHO QUALIFIES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Who Qualifies?</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              VITA serves a wide range of taxpayers. Most people earning $67,000 or less qualify.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {QUALIFIES.map((item) => (
              <div key={item.label} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={item.image} alt={item.label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="p-5 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 mb-2">{item.label}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Four steps from scheduling to your free refund.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col">
                <div className="relative h-48 rounded-xl overflow-hidden mb-5">
                  <Image src={step.image} alt={step.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute top-3 left-3 bg-emerald-700 text-white text-sm font-black px-3 py-1 rounded-lg">{step.number}</div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TO BRING LINK */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[380px] rounded-2xl overflow-hidden">
              <Image src="/images/pages/admin-documents-upload-hero.jpg" alt="Documents to bring" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">What to Bring</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Having the right documents ready before your appointment ensures your return is complete and accurate the first time. Missing documents may require a second visit.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                At minimum you will need a valid photo ID, Social Security cards for all household members, all W-2 and 1099 forms, and your bank account information for direct deposit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/tax/rise-up-foundation/documents" className="px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors text-center">
                  Full Document Checklist
                </Link>
                <Link href="/tax/rise-up-foundation/faq" className="px-8 py-4 border-2 border-emerald-700 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-center">
                  Eligibility FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IRS REFERENCE */}
      <section className="py-10 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 leading-relaxed">
            For more information about the VITA program, visit the{' '}
            <a href="https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
              IRS VITA overview page
            </a>
            . Rise Up Foundation is a 501(c)(3) nonprofit. All VITA services are provided by IRS-certified volunteers at no cost.
          </p>
        </div>
      </section>
    </div>
  );
}
