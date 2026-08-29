import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, DollarSign, FileCheck2, ShieldCheck } from 'lucide-react';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Tuition & Payment Guidance,
  description:
    'Review Elevate tuition and payment guidance. Current tuition and program-specific funding information are published on each program record.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/tuition' },
};

export default function TuitionPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Tuition & Payment Guidance' }]} />
      </div>

      <section className="bg-slate-950 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest">Enrollment finance</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">Tuition & Payment Guidance</h1>
          <p className="text-lg text-slate-300 max-w-3xl mt-5 leading-relaxed">
            Tuition, fees, included materials, payment terms, and third-party funding status are
            program-specific. Use the individual program record and enrollment agreement instead of
            relying on a generic institution-wide price or funding promise.
          </p>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: DollarSign,
              title: 'Published program price',
              text: 'Review the exact program page for its current published tuition or self-pay cost. The enrollment agreement controls the participant’s final contractual charges.',
            },
            {
              icon: FileCheck2,
              title: 'Third-party authorization',
              text: 'Workforce or other third-party funding is not treated as approved until the responsible source documents the participant, program, approved amount, and applicable terms.',
            },
            {
              icon: ShieldCheck,
              title: 'No blanket cost guarantee',
              text: 'Elevate does not promise that training, books, supplies, exams, transportation, childcare, or other costs will be covered unless that coverage is documented for the participant.',
            },
          ].map((item) => (
            <article key={item.title} className="border border-slate-200 rounded-xl p-6">
              <item.icon className="w-6 h-6 text-brand-red-600" />
              <h2 className="font-bold text-slate-900 text-lg mt-4">{item.title}</h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900">Programs with verified public workforce-funding records</h2>
          <p className="text-slate-600 max-w-3xl mt-3 mb-7">
            These program records are currently permitted to display workforce-funding labels in
            Elevate&apos;s canonical registry. This does not guarantee an individual participant&apos;s
            eligibility, award amount, or covered costs.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-brand-red-300 transition-colors">
                <h3 className="font-bold text-slate-900">{program.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{program.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-red-700 mt-4">
                  Review program <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-slate-900">Need the exact amount for a program?</h2>
          <p className="text-slate-600 mt-3">Open the current program record first, then use the application to document the intended payment or funding pathway.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/programs" className="bg-slate-950 text-white px-6 py-3 rounded-lg font-bold">Browse Programs</Link>
            <Link href="/apply" className="border border-slate-300 text-slate-900 px-6 py-3 rounded-lg font-bold">Start Application</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
