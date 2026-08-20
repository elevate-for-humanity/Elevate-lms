export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const metadata: Metadata = {
  title: `Grants & Workforce Funding | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Review program-specific workforce-funding pathways. Participant eligibility, covered costs, available funds, and authorization are determined by the responsible funding source.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/grants' },
};

const GRANTS = [
  {
    title: 'WIOA Funding',
    desc: 'WIOA may authorize eligible training costs for an eligible participant in an approved program. WorkOne or the responsible workforce entity determines the participant, program, amount, and services authorized.',
  },
  {
    title: 'Workforce Ready Grant',
    desc: 'Indiana Workforce Ready Grant consideration is program specific. Elevate publishes WRG status only for programs represented in its verified funding registry; the responsible agency makes the award decision.',
  },
  {
    title: 'Employer Training Support',
    desc: 'Employer grants, reimbursements, or sponsorships depend on the applicable program, employer agreement, eligibility rules, available funding, and written authorization. Employer participation alone does not create an award.',
  },
];

export default function GrantsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Grants & Workforce Funding</h1>
          <p className="text-xl text-blue-100">
            Review potential funding pathways without treating provider status or a website screen as an approval.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            Funding is not guaranteed. The responsible agency or funding source determines participant eligibility, program eligibility, allowable costs, available funds, and the written authorization required before an enrollment is treated as funded.
          </div>

          <div className="space-y-6">
            {GRANTS.map((grant) => (
              <article key={grant.title} className="bg-white p-8 rounded-xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <DollarSign className="w-8 h-8 text-blue-600 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="text-xl font-bold mb-2">{grant.title}</h2>
                    <p className="text-slate-700 leading-relaxed">{grant.desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-12 rounded-xl border border-slate-200 bg-white p-8" aria-labelledby="verified-funding-programs">
            <h2 id="verified-funding-programs" className="text-2xl font-bold text-slate-900">
              Program records currently allowed to display workforce-funding labels
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Appearance below is a program-status disclosure, not a participant award or promise that every cost will be covered.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
                <div key={program.slug} className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-900">{program.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{program.sourceNote}</p>
                  <Link href={`/programs/${program.slug}`} className="mt-3 inline-flex text-sm font-semibold text-brand-blue-700 hover:underline">
                    Review program record →
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-12 text-center">
            <Link href="/check-eligibility" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700">
              Start Preliminary Review <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <p className="mt-3 text-xs text-slate-500">The preliminary review does not issue funding approval.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
