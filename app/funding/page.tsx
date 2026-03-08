import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Funding | Elevate for Humanity',
  description: 'WIOA, Next Level Jobs, JRI, Job Ready Indy, and payment plans. Funding available for eligible Indiana residents.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding' },
};

const FUNDING_OPTIONS = [
  { title: 'WIOA Title I', sub: 'Federal', desc: 'Covers tuition, books, and supplies for eligible adults and dislocated workers. Apply through your local WorkOne center.', img: '/images/pages/funding-page-1.jpg', href: '/funding/federal-programs', cta: 'Learn More' },
  { title: 'Next Level Jobs', sub: 'Indiana State', desc: 'Indiana employer training grant covering certification costs in high-demand fields. Employer applies on your behalf.', img: '/images/pages/funding-page-2.jpg', href: '/funding/state-programs', cta: 'Learn More' },
  { title: 'Workforce Ready Grant', sub: 'Indiana State', desc: 'State grant covering high-demand certification programs. Apply through Indiana Career Connect.', img: '/images/pages/funding-page-4.jpg', href: '/funding/state-programs', cta: 'Learn More' },
  { title: 'JRI — Justice Reinvestment', sub: 'Indiana DWD', desc: 'Funded career training for eligible justice-involved individuals through Indiana DWD.', img: '/images/pages/jri-hero.jpg', href: '/funding/jri', cta: 'Learn More' },
  { title: 'Job Ready Indy', sub: 'Marion County', desc: 'Indianapolis initiative connecting Marion County residents to funded credential training.', img: '/images/pages/funding-page-6.jpg', href: '/funding/job-ready-indy', cta: 'Learn More' },
  { title: 'Payment Plans', sub: 'Self-Pay', desc: 'Flexible payment plans for self-pay students. Split tuition into manageable installments.', img: '/images/pages/funding-page-7.jpg', href: '/funding/payment-plans', cta: 'View Plans' },
];

const HOW_STEPS = [
  { n: '1', title: 'Check Eligibility', desc: 'Visit WorkOne or use Indiana Career Connect to see which programs you qualify for.', img: '/images/pages/wioa-eligibility-page-1.jpg' },
  { n: '2', title: 'Get Referred', desc: 'Your WorkOne case manager issues a training referral or Individual Training Account (ITA).', img: '/images/pages/workforce-board-page-2.jpg' },
  { n: '3', title: 'Enroll at Elevate', desc: 'We are ETPL listed — your funding is accepted directly. No out-of-pocket cost for eligible participants.', img: '/images/pages/enrollment-page-1.jpg' },
  { n: '4', title: 'Complete & Get Hired', desc: 'Finish your program, earn your credential, and connect to employer partners.', img: '/images/pages/career-services-page-10.jpg' },
];

export default function FundingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Video hero */}
      <section className="relative h-[320px] sm:h-[460px] overflow-hidden bg-slate-900">
        <video autoPlay muted loop playsInline poster="/images/pages/funding-hero.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-65">
          <source src="/videos/training-providers-video-with-narration.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </section>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Workforce Funding</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-3">Pay for Training</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Multiple funding sources are available for eligible Indiana residents. WIOA, state grants, and payment plans — we help you find the right path.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Apply Now <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              Check Eligibility
            </Link>
          </div>
        </div>
      </div>

      {/* Funding options */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Funding Sources</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Available Funding Options</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FUNDING_OPTIONS.map(({ title, sub, desc, img, href, cta }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-brand-red-300 text-[10px] font-bold uppercase tracking-widest">{sub}</span>
                    <h3 className="font-bold text-white text-sm leading-tight">{title}</h3>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">{desc}</p>
                  <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-brand-red-600 hover:text-brand-red-700 font-bold text-xs">
                    {cta} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to get funded */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">How to Get Funded</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_STEPS.map(({ n, title, desc, img }) => (
              <div key={n} className="flex flex-col">
                <div className="relative h-40 rounded-xl overflow-hidden mb-3 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="300px" className="object-cover" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-brand-red-600 text-white font-extrabold text-sm flex items-center justify-center shadow">{n}</div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer + CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Not Sure If You Qualify?</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Funding eligibility is determined by your local WorkOne office — not by Elevate. We are ETPL listed, which means your funding is accepted here once approved.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Eligibility is not guaranteed. Contact WorkOne Central Indiana or visit Indiana Career Connect to start your application.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Apply Now <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                  Check Eligibility
                </Link>
              </div>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/funding-page-8.jpg" alt="Workforce funding options" fill sizes="600px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
