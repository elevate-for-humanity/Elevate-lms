import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Elevate App',
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default function MarketingPwaPage() {
  return (
    <main className="min-h-[70vh] bg-white px-5 py-10 text-slate-950" data-pwa-launcher="marketing">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Elevate app</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Choose where you want to go.</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          This installed app is a direct launcher. Public website visits stay in the browser so search results open immediately instead of being captured by the PWA.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-black">Public website</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Programs, funding, apprenticeships, employers, and public information.</p>
          </Link>
          <a href="https://app.elevateforhumanity.org" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-black">Learner portal</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Courses, progress, apprenticeship access, and learner records.</p>
          </a>
          <a href="https://admin.elevateforhumanity.org" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-black">Admin portal</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Admin AI, Studio, Course Builder, operations, and management tools.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
