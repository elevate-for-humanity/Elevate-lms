import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/ojt-and-funding' },
  title: 'Earn While You Learn | OJT & Funding | Elevate For Humanity',
  description: 'Get paid while you train. On-the-Job Training, apprenticeships, and earn-while-you-learn programs in Indiana.',
};

export default function OJTAndFundingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Earn While You Learn' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px]">
        <Image src="/images/pages/ojt-and-funding-page-1.jpg" alt="Earn while you learn" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Earn While You Learn</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Get paid a real wage while you train for your new career. Apprenticeships and On-the-Job Training let you earn income from day one.
            </p>
          </div>
        </div>
      </section>

      {/* Two Paths */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">Two Ways to Earn While You Train</h2>
          <div className="space-y-5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
            {/* Apprenticeship */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-[200px]">
                <Image src="/images/pages/barber-training.jpg" alt="Apprenticeship training" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Apprenticeships</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Work at a real job site while completing your training hours. You earn a paycheck from your employer while learning hands-on skills from experienced professionals.
                </p>
                <div className="space-y-2 mb-4">
                  {['Paid hourly wage from day one', 'Hands-on training at a real workplace', '2,000+ hours of supervised experience', 'Industry certification upon completion', 'Job waiting for you when you finish'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/programs/barber-apprenticeship" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors">
                  View Barber Apprenticeship <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* OJT */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-[200px]">
                <Image src="/images/pages/ojt-and-funding-page-1.jpg" alt="On the job training" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-2">On-the-Job Training (OJT)</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Get hired by an employer and train on the job. Through WorkOne Indianapolis (Region 5), the local workforce board reimburses your employer 50–75% of your wages during training per local board policy, so employers are motivated to hire and train you.
                </p>
                <div className="space-y-2 mb-4">
                  {['Full employment from day one', 'Employer receives wage reimbursement', 'Training customized to the job', 'Leads to permanent employment', 'Available across many industries'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/employer" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors">
                  Employer Partnership <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">How to Get Started</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply at Elevate', desc: 'Submit a student application and tell us you are interested in earn-while-you-learn.' },
              { step: '2', title: 'Register at Indiana Career Connect', desc: 'Create your account at indianacareerconnect.com for funding eligibility.' },
              { step: '3', title: 'Meet with WorkOne', desc: 'Schedule an appointment at WorkOne Indianapolis to determine your WIOA/OJT eligibility. Your career advisor will review funding options and authorize the OJT contract.' },
              { step: '4', title: 'Get Matched', desc: 'We match you with an apprenticeship or OJT employer in your field.' },
              { step: '5', title: 'Start Earning', desc: 'Begin working and training on day one. Earn a paycheck while you learn.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{item.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Earning While You Learn</h2>
          <p className="text-white mb-6 text-sm">Apply today and tell us you want an earn-while-you-learn program.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/programs/apprenticeships" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              View Apprenticeships
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
