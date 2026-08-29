import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Award, Building2, FileCheck, ShieldCheck } from 'lucide-react';
import {
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
  getPublicFundingLabels,
} from '@/lib/programs/funding-registry';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WorkOne Partner Packet,
  description:
    'Program-specific workforce referral information for Elevate for Humanity. Public WIOA, ETPL, and Workforce Ready Grant statements are limited to programs in the verified funding registry.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/workone-partner-packet',
  },
};

export default function WorkOnePartnerPacketPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[{ label: 'Funding', href: '/funding' }, { label: 'WorkOne Partner Packet' }]}
          />
        </div>
      </div>

      <section className="bg-slate-950 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Workforce Partner Information
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5">WorkOne Partner Packet</h1>
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed">
            {PLATFORM_DEFAULTS.orgName} provides workforce training and registered apprenticeship
            services. Funding and ETPL statements below are program-specific. Provider approval does
            not mean that every Elevate program is eligible for WIOA or Workforce Ready Grant funds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg"
            >
              Participant Application
            </Link>
            <Link
              href="/contact"
              className="border border-white/30 text-white font-bold px-6 py-3 rounded-lg hover:bg-white/10"
            >
              Contact Elevate
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Building2,
              title: 'Provider and program are separate records',
              text: 'Elevate may participate as a training provider while individual programs have different approval and funding statuses.',
            },
            {
              icon: FileCheck,
              title: 'Written authorization controls funded enrollment',
              text: 'A participant is not treated as funded until the responsible workforce agency or funding source provides documented authorization.',
            },
            {
              icon: ShieldCheck,
              title: 'Claims are registry-controlled',
              text: 'Only programs in the verified funding registry may display current WIOA, ETPL, or Workforce Ready Grant public claims.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 p-6">
              <item.icon className="w-6 h-6 text-brand-red-600 mb-3" />
              <h2 className="font-bold text-slate-900 mb-2">{item.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6 text-brand-red-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">
              Verified workforce-funded program records
            </h2>
          </div>
          <p className="text-slate-600 max-w-3xl mb-8">
            The list below is generated from the same canonical registry used by public program
            pages. Participant eligibility, covered costs, available funds, and written
            authorization are determined by the responsible agency.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-brand-red-300 transition-colors"
              >
                <h3 className="font-bold text-slate-900 text-lg">{program.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{program.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {getPublicFundingLabels(program.slug).map((label) => (
                    <span
                      key={label}
                      className="text-xs font-semibold rounded-full bg-slate-100 text-slate-700 px-3 py-1"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4">{program.sourceNote}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold text-amber-950">Referral control</h2>
          <p className="text-sm text-amber-950 mt-2 leading-relaxed">
            Do not infer funding eligibility for a program that is not listed above. Refer the
            participant through the application process so the exact program, participant
            eligibility, and written funding authorization can be verified before enrollment is
            treated as agency-funded.
          </p>
        </div>
      </section>
    </div>
  );
}
