import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, GraduationCap, ShieldCheck } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
  getPublicFundingLabels,
} from '@/lib/programs/funding-registry';

export const metadata: Metadata = {
  title: `Education & Training | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Explore Elevate for Humanity education and career-training pathways. Workforce funding statements are made only for program records in the verified funding registry.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/education' },
};

const categories = [
  { name: 'Healthcare', href: '/programs?category=healthcare' },
  { name: 'Skilled Trades', href: '/programs?category=trades' },
  { name: 'Technology', href: '/programs?category=technology' },
  { name: 'Beauty & Personal Services', href: '/programs?category=beauty' },
  { name: 'Business', href: '/programs?category=business' },
  { name: 'Apprenticeship & Work-Based Learning', href: '/barber-and-beauty-apprenticeships' },
];

export default function EducationPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-400 uppercase tracking-widest text-xs font-bold mb-3">
            Career Education
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Education & Career Training</h1>
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed">
            Explore credential, career-training, and work-based learning pathways. Program cost,
            duration, credential, enrollment status, and funding information are controlled at the
            individual program level rather than by broad institution-wide promises.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-7 py-3.5 rounded-lg font-bold">
              Browse Programs
            </Link>
            <Link href="/apply" className="border border-white/30 hover:bg-white/10 text-white px-7 py-3.5 rounded-lg font-bold">
              Apply
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {categories.map((category) => (
              <Link key={category.name} href={category.href} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-red-300 transition-colors">
                <GraduationCap className="w-6 h-6 text-brand-red-600" />
                <h2 className="font-bold text-slate-900 text-lg mt-4">{category.name}</h2>
                <span className="inline-flex items-center text-sm text-brand-red-700 font-semibold mt-4">
                  View programs <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-brand-red-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">Verified workforce-funding records</h2>
          </div>
          <p className="text-slate-600 max-w-3xl mb-8">
            Only the programs listed below may display current public WIOA, ETPL, or Workforce Ready
            Grant claims in Elevate&apos;s canonical registry. Participant eligibility and written agency
            authorization are separate requirements.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="rounded-xl border border-slate-200 p-6 hover:border-brand-red-300">
                <h3 className="font-bold text-slate-900">{program.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{program.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {getPublicFundingLabels(program.slug).map((label) => (
                    <span key={label} className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{label}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-950">
            <CheckCircle className="w-5 h-5 flex-none mt-0.5" />
            <p>Programs not included in the verified funding registry are presented through their published self-pay or other documented enrollment pathway until program-level evidence supports a different public claim.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
