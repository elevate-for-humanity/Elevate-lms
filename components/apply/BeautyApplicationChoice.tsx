import Link from 'next/link';
import { CreditCard, MessageCircleQuestion } from 'lucide-react';

export default function BeautyApplicationChoice({
  programSlug,
  programTitle,
}: {
  programSlug: string;
  programTitle: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">Choose the correct path</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">{programTitle}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          An inquiry is free and does not enroll you. The enrollment application requires verified payment before it can be submitted.
        </p>
        <div className="mt-9 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <MessageCircleQuestion className="h-9 w-9 text-brand-blue-700" />
            <h2 className="mt-5 text-2xl font-black">Inquiry application</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Ask questions, request program information, and let admissions contact you. No payment is required and no enrollment is created.
            </p>
            <Link href={`/programs/${programSlug}/request-info`} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-brand-blue-700 px-6 py-3 font-black text-brand-blue-900 hover:bg-sky-50">
              Submit Free Inquiry
            </Link>
          </article>
          <article className="rounded-3xl border-2 border-brand-red-300 bg-white p-7 shadow-sm">
            <CreditCard className="h-9 w-9 text-brand-red-700" />
            <h2 className="mt-5 text-2xl font-black">Enrollment application</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Use PARIS or the standard form, review the payment calculator and BNPL options, and complete verified checkout before submission.
            </p>
            <Link href={`/apply/student/interview?program=${encodeURIComponent(programSlug)}&intent=enrollment`} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-black text-white hover:bg-brand-red-700">
              Start Enrollment Application
            </Link>
          </article>
        </div>
      </div>
    </main>
  );
}
