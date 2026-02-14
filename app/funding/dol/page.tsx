import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DOL Registered Apprenticeship Programs | Elevate for Humanity',
  description:
    'U.S. Department of Labor Registered Apprenticeship programs at Elevate for Humanity. Earn while you learn with paid on-the-job training and industry certifications.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/dol' },
};

const benefits = [
  'Earn wages during training — paid on-the-job learning',
  'Industry-recognized credentials upon completion',
  'Structured mentorship from experienced professionals',
  'Funding may cover full tuition for eligible participants',
  'Direct pathway to full-time employment',
  'Portable, nationally recognized certification',
];

const programs = [
  { name: 'Barber Apprenticeship', duration: '18-24 months', href: '/programs/barber-apprenticeship' },
  { name: 'HVAC Technician', duration: '12-18 months', href: '/programs/skilled-trades' },
  { name: 'Electrical Apprentice', duration: '12-24 months', href: '/programs/skilled-trades' },
  { name: 'Welding', duration: '6-12 months', href: '/programs/skilled-trades' },
];

export default function DOLFundingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'DOL Apprenticeship' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[380px] overflow-hidden">
        <Image src="/images/trades/program-welding-training.jpg" alt="DOL Registered Apprenticeship" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 w-full pb-10 sm:pb-14">
            <p className="text-blue-300 font-semibold text-sm mb-2 uppercase tracking-wide">U.S. Department of Labor</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">Registered Apprenticeship</h1>
            <p className="text-lg text-white/90 max-w-2xl">Earn while you learn. Get paid during training and graduate with a nationally recognized credential.</p>
          </div>
        </div>
      </section>

      {/* What Is It */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">What Is a Registered Apprenticeship?</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                A Registered Apprenticeship is an employer-driven, &quot;earn and learn&quot; training model approved by the U.S. Department of Labor. Apprentices receive paid on-the-job training combined with classroom instruction, leading to a nationally recognized credential.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Elevate for Humanity is a DOL Registered Apprenticeship Sponsor, meaning our programs meet federal standards for quality, safety, and outcomes.
              </p>
              <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/trades/program-welding-training.jpg" alt="Hands-on apprenticeship training" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">Apprenticeship Benefits</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 bg-white rounded-xl p-5 border border-slate-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Programs */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Available Apprenticeship Programs</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">Programs registered with the U.S. Department of Labor.</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {programs.map((p) => (
              <Link key={p.name} href={p.href} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition group">
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  <p className="text-sm text-slate-500">{p.duration}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How to Enroll */}
      <section className="py-14 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">How to Enroll</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Apply Online', desc: 'Complete the student application form' },
              { step: '2', title: 'Meet with Advisor', desc: 'Discuss program options and funding eligibility' },
              { step: '3', title: 'Start Training', desc: 'Begin earning while you learn' },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-12 h-12 rounded-full bg-brand-red-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-300 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/apply/student" className="inline-block mt-10 bg-white text-slate-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition">
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
