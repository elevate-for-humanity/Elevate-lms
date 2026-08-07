import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, MessageCircle } from 'lucide-react';
import InquiryForm from '../inquiry/InquiryForm';
import { loadApplyProgramOptions } from '@/lib/programs/public-program-list';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Inquiry | Elevate for Humanity',
  description: 'Ask questions about Elevate career training without starting an enrollment application.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/program-inquiry' },
};

export default async function ProgramInquiryPage({ searchParams }: { searchParams?: Promise<{ program?: string }> }) {
  const params = await searchParams;
  const initialProgram = normalizeProgramInterest(params?.program) ?? '';
  const { options } = await loadApplyProgramOptions();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-sm font-extrabold uppercase tracking-widest mb-4">Program Inquiry</p>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight max-w-4xl">Ask questions first. Apply when you are ready.</h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-3xl leading-relaxed">An inquiry is for information only. It does not start funding authorization, create an enrollment application, reserve a seat, or obligate you to enroll.</p>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <MessageCircle className="h-7 w-7 text-sky-700 mb-4" />
              <h2 className="text-2xl font-extrabold text-slate-950">Choose Inquiry when...</h2>
              <ul className="mt-4 space-y-3 text-base text-slate-700">
                <li>• You are comparing programs.</li>
                <li>• You need schedule, start-date, or prerequisite information.</li>
                <li>• You want to discuss cost or payment options.</li>
                <li>• You want a call before applying.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-brand-red-50 border border-brand-red-100 p-6">
              <ClipboardCheck className="h-7 w-7 text-brand-red-700 mb-4" />
              <h2 className="text-2xl font-extrabold text-slate-950">Ready to enroll?</h2>
              <p className="mt-3 text-base text-slate-700">The enrollment application starts admissions. Funded programs may require WorkOne intake and authorization. Self-pay programs move into pricing, payment, onboarding, and enrollment steps.</p>
              <Link href={`/apply${initialProgram ? `?program=${encodeURIComponent(initialProgram)}` : ''}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700">Start Enrollment Application <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <InquiryForm programs={options} initialProgram={initialProgram} />
        </div>
      </section>
    </main>
  );
}
