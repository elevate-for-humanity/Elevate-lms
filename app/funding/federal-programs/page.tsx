import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Federal Workforce Funding Programs',
  description:
    'Federal funding sources for workforce training in Indiana — WIOA, Pell Grants, , and more. Check eligibility and apply.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/federal-programs' },
};

const PROGRAMS = [
  {
    name: 'WIOA — Workforce Innovation and Opportunity Act',
    tag: 'Federal',
    who: 'Adults, dislocated workers, and youth ages 16–24.',
    covers: 'Tuition, books, exam fees, and supportive services for eligible high-demand programs.',
    href: '/funding/wioa',
  },
  {
    name: 'SNAP Employment & Training ()',
    tag: 'Federal / FSSA',
    who: 'Current SNAP recipients in Indiana.',
    covers:
      'Full tuition and supportive services at no cost. Elevate is a  approved provider.',
    href: '/snap-et-partner',
  },
  {
    name: 'Pell Grant',
    tag: 'Federal',
    who: 'Students with demonstrated financial need enrolled in eligible programs.',
    covers: 'Up to $7,395 per year for qualifying programs. Does not need to be repaid.',
    href: '/check-eligibility',
  },
  {
    name: 'Trade Adjustment Assistance (TAA)',
    tag: 'Federal / DOL',
    who: 'Workers who lost jobs due to foreign trade or outsourcing.',
    covers: 'Full tuition, income support, and job search assistance for approved programs.',
    href: '/check-eligibility',
  },
  {
    name: 'Veterans Benefits (GI Bill / VR&E)',
    tag: 'Federal / VA',
    who: 'Eligible veterans and service members.',
    covers: 'Tuition, housing allowance, and books for approved training programs.',
    href: '/check-eligibility',
  },
];

export default function FederalProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[{ label: 'Funding', href: '/funding' }, { label: 'Federal Programs' }]}
        />
      </div>

      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Federal Funding
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Federal Workforce Funding Programs
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Multiple federal programs fund workforce training for eligible Indiana residents. Many
            participants qualify for more than one source — we help you stack every dollar
            available.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/check-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check My Eligibility
            </Link>
            <Link
              href="/funding"
              className="border-2 border-white/40 text-slate-900 font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              All Funding Sources
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {PROGRAMS.map((p) => (
            <div key={p.name} className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-lg font-extrabold text-slate-900">{p.name}</h2>
                <span className="shrink-0 bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                  {p.tag}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Who qualifies
                  </p>
                  <p className="text-sm text-slate-700">{p.who}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    What it covers
                  </p>
                  <p className="text-sm text-slate-700">{p.covers}</p>
                </div>
              </div>
              <Link href={p.href} className="text-brand-red-600 hover:underline text-sm font-bold">
                Check eligibility →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">
            Not sure which program fits?
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Our enrollment team reviews every funding source you may qualify for — at no cost to
            you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/check-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check Eligibility
            </Link>
            <Link
              href="/contact"
              className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
