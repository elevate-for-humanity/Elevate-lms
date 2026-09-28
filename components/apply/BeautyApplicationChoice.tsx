import Link from 'next/link';
import { Building2, CreditCard, MessageCircleQuestion } from 'lucide-react';
import ApprenticeshipFundingNotice from './ApprenticeshipFundingNotice';

const HOST_SITE_PROGRAM_QUERY: Record<string, string> = {
  'barber-apprenticeship': 'barber',
  'cosmetology-apprenticeship': 'cosmetology',
  'esthetician-apprenticeship': 'esthetician',
  'nail-technician-apprenticeship': 'nail',
};

export default function BeautyApplicationChoice({
  programSlug,
  programTitle,
}: {
  programSlug: string;
  programTitle: string;
}) {
  const hostSiteProgram = HOST_SITE_PROGRAM_QUERY[programSlug] || '';
  const hostSiteHref = `/partners/host-shop/apply${hostSiteProgram ? `?program=${encodeURIComponent(hostSiteProgram)}` : ''}`;

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50 px-3 py-8 text-slate-950 sm:px-4 sm:py-12">
      <div className="mx-auto min-w-0 max-w-5xl">
        <p className="break-words text-xs font-black uppercase tracking-[0.14em] text-brand-red-700 sm:tracking-[0.18em]">
          Choose the correct path
        </p>
        <h1 className="mt-3 break-words text-3xl font-black sm:text-5xl">{programTitle}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          An inquiry is free and does not enroll you. The enrollment application requires verified
          payment before it can be submitted.
        </p>
        <div className="mt-6">
          <ApprenticeshipFundingNotice />
        </div>
        <div className="mt-9 grid gap-6 md:grid-cols-2">
          <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <MessageCircleQuestion className="h-9 w-9 text-brand-blue-700" />
            <h2 className="mt-5 text-2xl font-black">Inquiry application</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Ask questions, request program information, and let admissions contact you. No payment
              is required and no enrollment is created.
            </p>
            <Link
              href={`/programs/${programSlug}/request-info`}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-brand-blue-700 px-4 py-3 text-center font-black text-brand-blue-900 hover:bg-sky-50 sm:w-auto sm:px-6"
            >
              Submit Free Inquiry
            </Link>
          </article>
          <article className="min-w-0 rounded-3xl border-2 border-brand-red-300 bg-white p-5 shadow-sm sm:p-7">
            <CreditCard className="h-9 w-9 text-brand-red-700" />
            <h2 className="mt-5 text-2xl font-black">Enrollment application</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Use PARIS or the standard form, review the payment calculator and BNPL options, and
              complete verified checkout before submission.
            </p>
            <Link
              href={`/apply/student/interview?program=${encodeURIComponent(programSlug)}&intent=enrollment`}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-red-600 px-4 py-3 text-center font-black text-white hover:bg-brand-red-700 sm:w-auto sm:px-6"
            >
              Start Enrollment Application
            </Link>
          </article>
          <article className="min-w-0 rounded-3xl border border-emerald-300 bg-emerald-50 p-5 shadow-sm md:col-span-2 sm:p-7">
            <Building2 className="h-9 w-9 text-emerald-800" />
            <h2 className="mt-5 text-2xl font-black">Salon or shop application</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Licensed salons, barbershops, spas, and nail studios use one no-cost Host Site
              application to request approval to train apprentices.
            </p>
            <Link
              href={hostSiteHref}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-center font-black text-white hover:bg-emerald-900 sm:w-auto sm:px-6"
            >
              Apply as a Host Salon or Shop
            </Link>
          </article>
        </div>
      </div>
    </main>
  );
}
