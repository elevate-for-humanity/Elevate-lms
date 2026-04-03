import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import LazyVideo from '@/components/ui/LazyVideo';

export const metadata: Metadata = {
  title: 'OJT & Employer Funding | Elevate for Humanity',
  description: 'On-the-job training wage reimbursement, WOTC tax credits, and Registered Apprenticeship sponsorship for Indiana employers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/ojt-and-funding' },
};

const OJT_BENEFITS = [
  { title: 'Wage Reimbursement', desc: 'Employers receive up to 50% of trainee wages reimbursed during the OJT period through WIOA funding.', img: '/images/pages/funding-impact-3.jpg' },
  { title: 'Reduced Hiring Risk', desc: 'Try before you fully commit. OJT lets you evaluate a candidate on the job before permanent placement.', img: '/images/pages/funding-impact-4.jpg' },
  { title: 'Customized Training', desc: 'Training plan is built around your specific job requirements — not a generic curriculum.', img: '/images/pages/training-page-3.jpg' },
  { title: 'WOTC Tax Credits', desc: 'Claim up to $9,600 per qualifying hire through the Work Opportunity Tax Credit program.', img: '/images/pages/funding-impact-5.jpg' },
];

const APPRENTICESHIP = [
  { title: 'DOL Registered', desc: 'Elevate is a DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301). We handle compliance.', img: '/images/pages/apprenticeships-page-1.jpg' },
  { title: 'Employer Sponsors', desc: 'Your business becomes the training site. We provide the curriculum, credentials, and oversight.', img: '/images/pages/apprenticeships-page-2.jpg' },
  { title: 'Earn While You Learn', desc: 'Apprentices earn wages from day one while working toward a nationally recognized credential.', img: '/images/pages/apprenticeship-structure.jpg' },
];

export default function OjtAndFundingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Video hero */}
      <section className="relative h-[320px] sm:h-[460px] overflow-hidden">
        <LazyVideo src="/videos/training-providers-hero.mp4" poster="/images/pages/ojt-and-funding-page-1.jpg"
          className="absolute inset-0 w-full h-full object-cover" />
      </section>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">For Employers</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-3">OJT & Employer Funding</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Hire and train workers with up to 50% wage reimbursement, WOTC tax credits, and Registered Apprenticeship sponsorship — all coordinated through Elevate.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/testing/book?type=group-testing" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Talk to Us <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/employer" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              Employer Overview
            </Link>
          </div>
        </div>
      </div>

      {/* OJT benefits */}
      <section className="py-14 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">On-the-Job Training</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">OJT Benefits for Employers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {OJT_BENEFITS.map(({ title, desc, img }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-40 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="300px" className="object-cover" />
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apprenticeship */}
      <section className="py-14 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Registered Apprenticeship</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Sponsor an Apprentice</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {APPRENTICESHIP.map(({ title, desc, img }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="400px" className="object-cover" />
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Ready to Reduce Your Hiring Costs?</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Contact us to learn which incentives your business qualifies for and how to set up an OJT or apprenticeship agreement.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/testing/book?type=group-testing" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Get Started <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/employer" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                  Employer Overview
                </Link>
              </div>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/for-employers-page-1.jpg" alt="Employer OJT partnership" fill sizes="600px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
