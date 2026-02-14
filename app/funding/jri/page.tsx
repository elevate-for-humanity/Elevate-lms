import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'JRI — Job-Ready Incentive Funding | Elevate for Humanity',
  description:
    'Job-Ready Incentive (JRI) funding may cover tuition for eligible justice-involved individuals. Career training in healthcare, skilled trades, CDL, and more.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/jri' },
};

const eligibility = [
  'Currently or formerly justice-involved',
  'Indiana resident',
  'At least 18 years of age',
  'Enrolled in or accepted to an eligible training program',
  'Not currently receiving other state tuition funding for the same program',
];

const coveredItems = [
  'Tuition and training fees',
  'Certification and exam fees',
  'Required tools, uniforms, and supplies',
  'Background check fees (where applicable)',
];

export default function JRIFundingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'JRI' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[380px] overflow-hidden">
        <Image src="/images/heroes-hq/jri-hero.jpg" alt="JRI Job-Ready Incentive program" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 w-full pb-10 sm:pb-14">
            <p className="text-green-300 font-semibold text-sm mb-2 uppercase tracking-wide">Indiana DWD</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">Job-Ready Incentive (JRI)</h1>
            <p className="text-lg text-white/90 max-w-2xl">Career training for eligible justice-involved Hoosiers. Tuition, supplies, and certification fees may be covered.</p>
          </div>
        </div>
      </section>

      {/* What Is JRI */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">What Is JRI?</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                The Job-Ready Incentive (JRI) is an Indiana state program designed to cover the cost of career training for eligible justice-involved individuals. Administered by the Indiana Department of Workforce Development (DWD), JRI removes financial barriers so participants can focus on earning certifications and building careers.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Elevate for Humanity is an approved JRI training provider. Our programs are designed to get participants certified and employed in high-demand fields within weeks, not years.
              </p>
              <Link href="/apply/student" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg">
                Apply for JRI Funding <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/trades/program-construction-training.jpg" alt="JRI career training" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* What's Covered + Eligibility */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">What JRI Covers</h2>
              <div className="space-y-3">
                {coveredItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Eligibility</h2>
              <div className="space-y-3">
                {eligibility.map((item) => (
                  <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">How to Get JRI Funding</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Contact Elevate for Humanity', desc: 'Call (317) 314-3757 or apply online. Our enrollment team will verify your eligibility and help you choose a program.' },
              { step: '2', title: 'Register at WorkOne', desc: 'Create an account at indianacareerconnect.com and schedule an appointment with your local WorkOne office.' },
              { step: '3', title: 'Get Approved', desc: 'WorkOne confirms your JRI eligibility and issues a funding voucher for your training program.' },
              { step: '4', title: 'Start Training', desc: 'Begin your program. For approved participants, JRI covers tuition and related costs.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white text-lg font-bold flex items-center justify-center flex-shrink-0">{s.step}</div>
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
      <section className="py-16 sm:py-24 bg-green-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Your Past Doesn&apos;t Define Your Future</h2>
          <p className="text-xl text-white/90 mb-10">JRI funding may give you a fresh start with funded career training. Check your eligibility today.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-green-700 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition hover:scale-105 shadow-lg">Apply Now</Link>
            <Link href="/contact" className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
