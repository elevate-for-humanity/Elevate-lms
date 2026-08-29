import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, DollarSign, FileCheck2, GraduationCap, ShieldCheck } from 'lucide-react';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const metadata: Metadata = {
  title: 'Funding Eligibility Review,
  description:
    'Start a workforce-funding eligibility review. Screening does not guarantee WIOA, Workforce Ready Grant, employer, or other third-party funding.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/eligibility' },
};

export default function EligibilityPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 font-bold uppercase tracking-widest text-xs">Funding review</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">Check the exact program and participant</h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mt-6">
            Elevate can screen information for possible funding pathways, but a website answer is not
            an eligibility determination or award. The responsible agency controls participant
            eligibility, program eligibility, covered costs, funding availability, and authorization.
          </p>
          <Link href="/apply" className="inline-flex items-center gap-2 mt-8 bg-brand-red-600 hover:bg-brand-red-700 px-7 py-3.5 rounded-lg font-bold">
            Start Application <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: DollarSign, title: 'WIOA / WorkOne', text: 'May support eligible participants in approved program records when local workforce requirements and written authorization are satisfied.' },
            { icon: GraduationCap, title: 'Workforce Ready Grant', text: 'May support qualifying Indiana participants in qualifying programs under the state rules and award limits in effect.' },
            { icon: Building2, title: 'Employer or other funding', text: 'Employer sponsorship, reimbursement, grants, and supportive-service funding have separate requirements and must be documented before being treated as approved.' },
          ].map((item) => (
            <article key={item.title} className="bg-white border border-slate-200 rounded-xl p-6">
              <item.icon className="w-6 h-6 text-brand-red-600" />
              <h2 className="font-bold text-slate-900 text-lg mt-4">{item.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <FileCheck2 className="w-6 h-6 text-brand-red-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">Verified public workforce-funding records</h2>
          </div>
          <p className="text-slate-600 max-w-3xl mt-3 mb-7">
            These are the programs currently permitted by Elevate&apos;s canonical funding registry to
            display public workforce-funding claims. Inclusion does not guarantee an individual award.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="rounded-xl border border-slate-200 p-6 hover:border-brand-red-300">
                <h3 className="font-bold text-slate-900">{program.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{program.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto rounded-xl bg-amber-50 border border-amber-200 p-6 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-800 flex-none mt-0.5" />
          <p className="text-sm text-amber-950 leading-relaxed">
            Do not rely on a screening result as proof of funding. Elevate should treat an enrollment
            as third-party funded only after receiving the applicable written authorization or other
            documentary evidence from the responsible source.
          </p>
        </div>
      </section>
    </main>
  );
}
