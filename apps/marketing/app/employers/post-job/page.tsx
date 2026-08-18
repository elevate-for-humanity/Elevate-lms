import type { Metadata } from 'next';
import Link from 'next/link';

const EMPLOYER_PORTAL = 'https://app.elevateforhumanity.org/employer';

export const metadata: Metadata = {
  title: 'Post a Job | Elevate for Humanity',
  description: 'Employer entry point for posting jobs, hiring trained candidates, and apprenticeship partnerships.',
};

export default function EmployerPostJobPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-red-300">Employers</p>
          <h1 className="text-4xl font-black md:text-6xl">Post a Job & Build Your Talent Pipeline</h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-200">
            Employers can use the Elevate employer portal to manage job opportunities, candidate connections, and apprenticeship participation.
          </p>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Post a Job</h2>
            <p className="mt-3 text-slate-600">Sign in to the employer portal to create or manage hiring opportunities.</p>
            <a href={EMPLOYER_PORTAL} className="mt-5 inline-flex font-bold text-brand-blue-700 hover:underline">Open Employer Portal →</a>
          </article>
          <article className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Hire Graduates</h2>
            <p className="mt-3 text-slate-600">Review Elevate's employer partnership and talent-pipeline information.</p>
            <Link href="/hire-graduates" className="mt-5 inline-flex font-bold text-brand-blue-700 hover:underline">Hire Graduates →</Link>
          </article>
          <article className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Host an Apprentice</h2>
            <p className="mt-3 text-slate-600">Learn how a licensed business can participate as a barber or beauty apprenticeship host shop.</p>
            <Link href="/partners/host-shops" className="mt-5 inline-flex font-bold text-brand-blue-700 hover:underline">Host Shop Information →</Link>
          </article>
        </div>
      </section>

      <section className="border-t bg-slate-50 px-4 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row">
          <a href={EMPLOYER_PORTAL} className="rounded-xl bg-brand-red-600 px-6 py-3 text-center font-bold text-white hover:bg-brand-red-700">Employer Portal</a>
          <Link href="/contact" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-bold text-slate-900 hover:bg-slate-100">Contact Employer Team</Link>
        </div>
      </section>
    </main>
  );
}
