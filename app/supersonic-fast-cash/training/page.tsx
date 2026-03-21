import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata: Metadata = {
  title: 'Tax Preparer Training | Supersonic Fast Cash',
  description: 'Become a certified tax preparer. PTIN registration, IRS e-file authorization, and the option to join the Supersonic Fast Cash preparer network.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/supersonic-fast-cash/training' },
};

const MODULES = [
  { title: 'Tax Law Fundamentals', desc: 'Filing status, dependents, income types, standard vs. itemized deductions, and the structure of Form 1040.', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { title: 'Credits & Deductions', desc: 'Earned Income Tax Credit, Child Tax Credit, education credits, retirement savings credits, and common deductions.', image: '/images/pages/finance-accounting.jpg' },
  { title: 'Self-Employment & Business', desc: 'Schedule C preparation, business expense deductions, home office, vehicle mileage, and quarterly estimated taxes.', image: '/images/pages/supersonic-page-5.jpg' },
  { title: 'IRS E-File Procedures', desc: 'How to use IRS-approved software, submit e-file returns, handle rejections, and obtain your EFIN.', image: '/images/pages/admin-tax-filing-hero.jpg' },
  { title: 'Refund Products', desc: 'How refund advances work, eligibility requirements, disclosure requirements, and compliance obligations.', image: '/images/pages/supersonic-page-2.jpg' },
  { title: 'Client Service', desc: 'Intake interviews, document verification, quality review, and professional standards for tax preparers.', image: '/images/pages/supersonic-page-7.jpg' },
];

const OUTCOMES = [
  { label: 'PTIN Registration', desc: 'IRS Preparer Tax Identification Number — required to prepare returns for compensation.', image: '/images/pages/supersonic-tax-cert.jpg' },
  { label: 'IRS E-File Authorization', desc: 'EFIN authorization to submit returns electronically as an authorized IRS e-file provider.', image: '/images/pages/admin-tax-training-hero.jpg' },
  { label: 'Preparer Network Access', desc: 'Option to join the Supersonic Fast Cash preparer network and receive client referrals during tax season.', image: '/images/pages/supersonic-page-4.jpg' },
  { label: 'Continuing Education', desc: 'Annual CE credits to maintain your PTIN and stay current on tax law changes.', image: '/images/pages/admin-ferpa-training-hero.jpg' },
];

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SupersonicPageHero
        image="/images/pages/supersonic-training-hero.jpg"
        alt="Supersonic Fast Cash tax preparer training program"
        title="Tax Preparer Training Program"
        subtitle="Get PTIN-certified and start earning as a professional tax preparer. No prior experience required."
      />

      {/* OVERVIEW */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">About the Program</h2>
              <p className="text-lg text-slate-600 mb-5 leading-relaxed">
                Supersonic Fast Cash offers a complete tax preparer training program for individuals who want to start a career in tax preparation. The program is offered through Elevate for Humanity's workforce training division and is available in-person and online.
              </p>
              <p className="text-slate-600 mb-5 leading-relaxed">
                No prior tax or accounting experience is required. The program covers everything from basic tax law to IRS e-file procedures and client service. Graduates are prepared to sit for the IRS PTIN registration and begin preparing returns immediately.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Funding may be available for qualifying participants through WIOA, Indiana DWD, and other workforce development programs. Contact us to discuss your eligibility.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/supersonic-fast-cash/training/courses" className="px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors text-center">View Courses</Link>
                <Link href="/supersonic-fast-cash/apply" className="px-8 py-4 border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors text-center">Apply Now</Link>
              </div>
            </div>
            <div className="relative h-[420px] rounded-2xl overflow-hidden">
              <Image src="/images/pages/admin-tax-training-hero.jpg" alt="Tax preparer training" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">What You Will Learn</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Six modules covering everything you need to prepare individual and small business returns professionally.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((mod) => (
              <div key={mod.title} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={mod.image} alt={mod.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">What You Earn</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Graduates leave with credentials and network access to start earning immediately.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {OUTCOMES.map((item) => (
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

      {/* CTA */}
      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/supersonic-training-hero.jpg" alt="Start your tax career" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Start Your Tax Career</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/supersonic-fast-cash/training/courses" className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">View Courses</Link>
              <Link href="/supersonic-fast-cash/careers" className="px-10 py-4 bg-white text-slate-900 font-black text-xl rounded-xl hover:bg-slate-100 transition-colors">Join Our Team</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
