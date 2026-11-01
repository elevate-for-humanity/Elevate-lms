import type { Metadata } from 'next';
import Link from 'next/link';
import InlineStoreDemo from '@/components/store/InlineStoreDemo';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const metadata: Metadata = {
  title: 'Testing Center Software | Elevate Store',
  description:
    'Explore testing-center scheduling, candidate records, proctor workflows and credential tracking in a guided software demo.',
  alternates: { canonical: 'https://store.elevateforhumanity.org/store/testing' },
};
export default function TestingCenterProductPage() {
  return (
    <main className="bg-stone-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs
          items={[{ label: 'Store', href: '/store' }, { label: 'Testing Center Software' }]}
        />
        <section className="mt-6 grid items-center gap-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-800">
              Software for testing organizations
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Organize your testing center.
            </h1>
            <p className="mt-4 leading-7 text-slate-700">
              Explore scheduling, candidate records, proctor workflows, results and credential
              tracking before adding testing software to your organization’s plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/store/plans?addon=credential-testing-center"
                className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                View software plans
              </Link>
              <Link
                href="/testing"
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold"
              >
                Need an exam? Book testing
              </Link>
            </div>
          </div>
          <InlineStoreDemo
            name="Testing Center"
            href="/store/demo/capability/testing_center"
            poster="/images/refresh-20261014/testing.webp"
          />
        </section>
        <section className="grid gap-4 py-8 sm:grid-cols-3" aria-label="Testing software workflow">
          {[
            ['Schedule', 'Coordinate testing dates, seats and appointment status.'],
            ['Prepare', 'Review candidate readiness, authorizations and proctor responsibilities.'],
            ['Follow through', 'Keep results and credential records connected to each candidate.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
