import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, ExternalLink, FileCheck, ShieldCheck } from 'lucide-react';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Workforce Ready Grant | Indiana Funding Guidance',
  description:
    'Current guidance for Indiana Workforce Ready Grant consideration. Eligibility depends on the participant, the qualifying program, the approved provider record, and current state requirements.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/wrg' },
};

const WRG_PROGRAMS = VERIFIED_WORKFORCE_FUNDED_PROGRAMS.filter((program) => program.wrgEligible);

export default function WorkforceReadyGrantPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Funding', href: '/funding' }, { label: 'Workforce Ready Grant' }]}
        />
      </div>

      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Indiana Funding Guidance
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-5">Workforce Ready Grant</h1>
          <p className="text-slate-300 text-lg max-w-3xl leading-relaxed">
            The Workforce Ready Grant may cover eligible tuition and mandatory fees for qualifying
            Indiana certificate programs, subject to current state rules and the participant&apos;s
            eligibility. Funding is not guaranteed by Elevate and must be confirmed before training
            is treated as funded.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/apply"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Start Application
            </Link>
            <a
              href="https://www.in.gov/dwd/workforce-ready-grant/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/30 text-white font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm inline-flex items-center gap-2"
            >
              Indiana WRG Information <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: 'Participant eligibility',
                desc: 'Indiana determines participant eligibility under the rules in effect for the applicable award period.',
              },
              {
                icon: FileCheck,
                title: 'Program eligibility',
                desc: 'The participant must enroll in a qualifying program at an approved provider. Provider approval alone does not make every program WRG eligible.',
              },
              {
                icon: CheckCircle,
                title: 'Written confirmation',
                desc: 'Elevate treats a participant as funded only after the responsible agency or funding source provides written authorization or other documented confirmation.',
              },
            ].map((item) => (
              <div key={item.title} className="border border-slate-200 rounded-xl p-6">
                <item.icon className="w-6 h-6 text-brand-red-600 mb-3" />
                <h2 className="font-bold text-slate-900 mb-2">{item.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Elevate programs currently allowed to display a WRG consideration claim
          </h2>
          <p className="text-slate-600 mb-7 max-w-3xl">
            This list is generated from Elevate&apos;s canonical verified funding registry. Programs
            not shown here are presented as self-pay unless and until a program-level approval is
            verified and added to that registry.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {WRG_PROGRAMS.map((program) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                className="border border-slate-200 rounded-xl p-6 hover:border-brand-red-300 transition-colors"
              >
                <h3 className="font-bold text-slate-900 text-lg">{program.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{program.description}</p>
                <p className="text-xs text-slate-500 mt-4">
                  WRG may be considered for eligible participants. Current agency authorization is
                  required before funded enrollment.
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-950 leading-relaxed">
            <strong>Important:</strong> State rules, funding availability, participant eligibility,
            grant caps, and qualifying-program lists can change. Elevate&apos;s application and intake
            process does not itself create funding eligibility or an award.
          </div>
        </div>
      </section>
    </div>
  );
}
