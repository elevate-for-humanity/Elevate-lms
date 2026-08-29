import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, FileCheck2, Heart, ShieldCheck, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Justice-Involved Participant Funding Guidance,
  description:
    'Guidance for justice-involved participants seeking training and supportive-service funding. Eligibility, program approval, covered costs, and authorization must be verified by the responsible source.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/jri' },
};

export default function JriPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Justice-Involved Participant Guidance' }]} />
        </div>
      </div>

      <section className="bg-slate-950 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest">Reentry and funding guidance</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">Training pathways for justice-involved participants</h1>
          <p className="text-slate-300 text-lg max-w-3xl mt-5 leading-relaxed">
            Elevate can help identify training and supportive-service pathways, but this page does
            not create a JRI award, guarantee free training, establish eligibility, promise a job,
            or guarantee that a particular cost will be covered.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 px-7 py-3.5 rounded-lg font-bold">
              Start Application <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="border border-white/30 hover:bg-white/10 px-7 py-3.5 rounded-lg font-bold">
              Contact Enrollment
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: FileCheck2,
              title: 'Eligibility is source-specific',
              text: 'Justice-system involvement by itself does not prove eligibility for a particular grant, referral, training authorization, or supportive service.',
            },
            {
              icon: ShieldCheck,
              title: 'Program approval must be verified',
              text: 'The exact training program and provider record must satisfy the requirements of the responsible funding source. Provider participation does not automatically make every program eligible.',
            },
            {
              icon: Users,
              title: 'Authorization controls enrollment',
              text: 'Elevate should record the enrollment as third-party funded only after receiving documentary authorization that identifies the participant, program, approved amount, and applicable terms.',
            },
          ].map((item) => (
            <article key={item.title} className="border border-slate-200 rounded-xl p-6">
              <item.icon className="w-6 h-6 text-brand-red-600" />
              <h2 className="font-bold text-slate-900 text-lg mt-4">{item.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-brand-red-600 flex-none mt-1" />
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">What Elevate can document during intake</h2>
              <p className="text-slate-600 mt-3 max-w-3xl leading-relaxed">
                Intake can identify the requested program, referral source, justice-involvement or
                reentry context when relevant, existing case manager or agency contact, requested
                supportive services, and documents still needed. That record can then be matched to
                the requirements of the actual funding or referral source.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            {[
              'No promise that tuition, exams, tools, supplies, transportation, housing, legal services, childcare, or other costs are covered without documented authorization.',
              'No promise of employment, placement timing, wage level, salary, employer participation, credential attainment, licensure, or exam passage.',
              'No testimonial or participant outcome should be published as fact without evidence and consent supporting the exact statement.',
              'No program should be labeled JRI-funded or agency-approved merely because a participant may be justice-involved or referred for services.',
            ].map((text) => (
              <div key={text} className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-700 leading-relaxed">{text}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 leading-relaxed">
          <strong>Funding control:</strong> Application and screening are not funding decisions. If a
          public agency, probation/parole program, workforce entity, employer, foundation, or other
          source is expected to pay, the corresponding authorization should be stored with the
          participant record before the system represents the enrollment as funded.
        </div>
      </section>
    </main>
  );
}
