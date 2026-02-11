import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { GraduationCap, Building2, Users, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { resolveProgram } from '@/lib/program-registry';

export const metadata: Metadata = {
  title: 'Apply | Elevate for Humanity',
  description: 'Apply for free workforce training programs, employer partnerships, or staff positions at Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; pathway?: string }>;
}) {
  const params = await searchParams;
  const rawProgram = (params?.program || params?.pathway || '').trim();

  // If a program slug (or alias) is provided, resolve and redirect directly — no intermediate page
  if (rawProgram) {
    const entry = resolveProgram(rawProgram);
    if (entry) {
      if (entry.dedicatedApplyPage) {
        redirect(entry.dedicatedApplyPage);
      }
      redirect(`/apply/student?program=${entry.slug}`);
    }
    // Unknown slug — redirect to student form anyway (they can pick from dropdown)
    redirect('/apply/student');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 px-4 bg-white border-b">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Apply to Elevate for Humanity
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the application that fits you. Most training programs are free through WIOA funding.
          </p>
        </div>
      </section>

      {/* Application paths */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6">

          {/* Student — primary */}
          <Link
            href="/apply/student"
            className="bg-white rounded-xl border-2 border-blue-600 p-6 sm:p-8 hover:shadow-lg transition-shadow group relative"
          >
            <div className="absolute -top-3 left-6 bg-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold">
              Most Common
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Student Application</h2>
            <p className="text-slate-600 mb-4">
              Apply for career training programs — healthcare, skilled trades, technology, barbering, and more.
            </p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                5-10 minute application
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Most programs are FREE with WIOA
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                No account required to apply
              </li>
            </ul>
            <span className="inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
              Start Application <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Employer */}
          <Link
            href="/apply/employer"
            className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 hover:shadow-lg hover:border-slate-300 transition-all group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Employer Partnership</h2>
            <p className="text-slate-600 mb-4">
              Partner with us to find qualified candidates and build your workforce pipeline.
            </p>
            <span className="inline-flex items-center gap-2 text-orange-600 font-semibold group-hover:gap-3 transition-all">
              Apply as Employer <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Staff / Instructor */}
          <Link
            href="/apply/staff"
            className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 hover:shadow-lg hover:border-slate-300 transition-all group"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Staff / Instructor</h2>
            <p className="text-slate-600 mb-4">
              Join our team as an instructor, advisor, or support staff member.
            </p>
            <span className="inline-flex items-center gap-2 text-indigo-600 font-semibold group-hover:gap-3 transition-all">
              Apply as Staff <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Program Holder */}
          <Link
            href="/apply/program-holder"
            className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 hover:shadow-lg hover:border-slate-300 transition-all group"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Program Holder</h2>
            <p className="text-slate-600 mb-4">
              Offer training programs to your community or organization through our platform.
            </p>
            <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
              Apply as Program Holder <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Track existing application */}
        <div className="max-w-5xl mx-auto mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Already applied?{' '}
            <Link href="/apply/track" className="text-blue-600 hover:underline font-medium">
              Track your application status
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
