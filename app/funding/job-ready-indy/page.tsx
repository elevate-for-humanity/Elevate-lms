import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Ready Indy | Elevate for Humanity',
  description:
    'Job Ready Indy is an Indianapolis workforce initiative connecting residents to funded career training, credentials, and employment. Elevate for Humanity is an approved Job Ready Indy training provider.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/job-ready-indy' },
};

export default function JobReadyIndyPage() {
  return (
    <div className="min-h-screen bg-white">      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Job Ready Indy' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[200px] sm:h-[260px] overflow-hidden">
        <Image src="/images/pages/jri-hero.jpg" alt="Job Ready Indy workforce training" fill className="object-cover" priority sizes="100vw" />
      </section>
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Job Ready Indy</h1>
          <p className="text-slate-600 mt-2">Indianapolis workforce initiative — funded career training for Marion County residents.</p>
        </div>
      </div>

      {/* What Is Job Ready Indy */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">What Is Job Ready Indy?</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                <strong>Job Ready Indy</strong> is an Indianapolis-based workforce initiative that connects Marion County residents to funded career training, industry credentials, and employer placement. The program is designed to remove financial and logistical barriers so residents can access quality training and enter high-demand careers.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Elevate for Humanity is an approved Job Ready Indy training provider. Our credential pathway programs in healthcare, skilled trades, technology, and CDL are aligned with the employment outcomes Job Ready Indy is designed to achieve.
              </p>
              <Link href="/start" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/pages/student-portal-page-5.jpg" alt="Job Ready Indy career training" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* What's Covered + Eligibility */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">What Job Ready Indy Covers</h2>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="text-slate-700 leading-relaxed">
                  Job Ready Indy funding may cover tuition and training fees, certification and exam fees, and supportive services for eligible Marion County residents. Coverage depends on your eligibility and the program you enroll in. Contact our enrollment team to confirm what applies to your situation.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Eligibility</h2>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="text-slate-700 leading-relaxed">
                  Job Ready Indy is primarily for Marion County residents who are unemployed, underemployed, or seeking to advance their careers. You must be at least 18 years of age and not currently enrolled in a conflicting funded program. Our enrollment team will verify your eligibility at no cost.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">How to Get Started</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Contact Elevate for Humanity', desc: 'Call (317) 314-3757 or apply online. Our enrollment team will confirm your eligibility and match you to the right program.' },
              { step: '2', title: 'Choose Your Program', desc: 'Select from credential pathways in healthcare, skilled trades, technology, CDL, and more — all aligned with Marion County employer demand.' },
              { step: '3', title: 'Get Enrolled', desc: 'We handle the paperwork and coordinate with Job Ready Indy on your behalf. You focus on showing up and completing your training.' },
              { step: '4', title: 'Earn Your Credential', desc: 'Complete your program and earn a nationally recognized credential. Our career services team connects you with employer partners.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white text-lg font-bold flex items-center justify-center flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{s.title}</h3>
                  <p className="text-slate-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 text-base leading-relaxed mb-10">Job Ready Indy funding may be available for your career training. Apply today and our team will confirm your eligibility.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-xl font-bold text-base transition">Apply Now</Link>
            <Link href="/contact" className="border-2 border-slate-600 hover:border-slate-400 text-white px-10 py-4 rounded-xl font-bold text-base transition">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
