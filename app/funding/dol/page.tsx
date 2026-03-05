export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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


export default async function DOLFundingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('funding_sources').select('*').limit(50);
const programs = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'DOL Apprenticeship' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <Image src="/images/pages/funding-page-1.jpg" alt="DOL Registered Apprenticeship" fill className="object-cover" priority sizes="100vw" />
        
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
                Elevate for Humanity is a DOL Registered Apprenticeship Sponsor for select programs (currently Barber Apprenticeship), meaning these programs meet federal standards for quality, safety, and outcomes.
              </p>
              <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/pages/funding-page-1.jpg" alt="Hands-on apprenticeship training" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-6">Apprenticeship Benefits</h2>
          <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-slate-700 leading-relaxed">
              Registered Apprenticeships let you earn wages during training through paid on-the-job learning. 
              You receive industry-recognized credentials upon completion that are portable and nationally recognized. 
              Experienced professionals provide structured mentorship throughout the program. 
              Funding may cover full tuition for eligible participants, and the apprenticeship creates a direct pathway to full-time employment with the training employer.
            </p>
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
              <Link key={p.name} href={p.href} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:shadow-sm transition group">
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors">{p.name}</h3>
                  <p className="text-sm text-slate-500">{p.duration}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600 transition-colors" />
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
