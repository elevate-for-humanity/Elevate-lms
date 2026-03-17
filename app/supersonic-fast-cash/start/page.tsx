import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata: Metadata = {
  title: 'Start Your Tax Return | Supersonic Fast Cash',
  description: "Begin your tax preparation. Choose how you'd like to file — online, in-person, or with document upload.",
  alternates: { canonical: 'https://www.supersonicfastermoney.com/supersonic-fast-cash/start' },
};

const OPTIONS = [
  {
    title: 'File Online (DIY)',
    description: "Answer guided questions and file from home. Best for simple W-2 returns. Step-by-step interview format walks you through every section. Import your W-2 directly and e-file in minutes.",
    image: '/images/pages/supersonic-page-3.jpg',
    href: '/supersonic-fast-cash/diy-taxes',
    cta: 'Start Online Filing',
  },
  {
    title: 'Upload Documents',
    description: "Send us your tax documents securely and our PTIN-credentialed preparers will handle everything. You review and approve before anything is filed. Best for moderate to complex returns.",
    image: '/images/pages/admin-documents-upload-hero.jpg',
    href: '/supersonic-fast-cash/upload-documents',
    cta: 'Upload Documents',
  },
  {
    title: 'Book Appointment',
    description: "Meet with a tax preparer in person at our Indianapolis office or virtually. One-on-one attention for complex returns — self-employment, rental income, multiple states, or business filings.",
    image: '/images/pages/supersonic-page-7.jpg',
    href: '/supersonic-fast-cash/book-appointment',
    cta: 'Book Appointment',
  },
];

const BEFORE_STEPS = [
  { label: 'W-2s from all employers', image: '/images/pages/supersonic-page-6.jpg' },
  { label: 'All 1099 forms', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { label: 'Social Security numbers for all household members', image: '/images/pages/supersonic-page-8.jpg' },
  { label: 'Bank account and routing number for direct deposit', image: '/images/pages/finance-accounting.jpg' },
];

export default function StartPage() {
  return (
    <div className="min-h-screen bg-white">
      <SupersonicPageHero
        image="/images/pages/supersonic-page-1.jpg"
        alt="Start your tax return with Supersonic Fast Cash"
        title="Let's Get Your Taxes Filed"
        subtitle="Choose how you'd like to file. We're here to help every step of the way."
      />

      {/* FILING OPTIONS */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">Choose Your Filing Method</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {OPTIONS.map((opt) => (
              <div key={opt.title} className="rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="relative h-52 w-full flex-shrink-0">
                  <Image src={opt.image} alt={opt.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-6 flex flex-col flex-1 bg-white">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{opt.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">{opt.description}</p>
                  <Link href={opt.href} className="mt-6 block w-full text-center py-3 px-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors">
                    {opt.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TO BRING */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">What to Bring</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Having these documents ready before you start will make the process faster and ensure your return is complete.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {BEFORE_STEPS.map((item) => (
              <div key={item.label} className="rounded-2xl overflow-hidden border border-slate-200">
                <div className="relative h-36">
                  <Image src={item.image} alt={item.label} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="p-4 bg-white">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL OPTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/contact-page-1.jpg" alt="Call Supersonic Fast Cash" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Prefer to Talk First?</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Not sure which option is right for you? Call us and we'll help you figure out the best approach for your tax situation. No commitment required.
              </p>
              <a href="tel:+13173143757" className="inline-block px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING CTA */}
      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/supersonic-page-5.jpg" alt="Supersonic Fast Cash pricing" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Questions About Pricing?</h2>
            <p className="text-xl text-slate-200 mb-8">See our transparent pricing before you start.</p>
            <Link href="/supersonic-fast-cash/pricing" className="px-10 py-4 bg-white text-slate-900 font-black text-xl rounded-xl hover:bg-slate-100 transition-colors">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
