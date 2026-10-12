import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'About Supersonic Fast Cash',
  description:
    'Tax preparation for individuals and businesses, plus training for people who want to start their own tax office.',
};
export default function About() {
  return (
    <TaxSiteShell>
      <main className="px-5 py-10 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wide text-[#073ca2]">
          SUPERSONIC FAST CASH LLC
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
          Tax preparation. A path to your own business.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
          Supersonic Fast Cash serves individuals, self-employed clients and businesses seeking tax
          preparation help. We also support people interested in learning tax preparation and
          planning their own tax office.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border p-6">
            <h2 className="text-2xl font-bold">For taxpayers</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Choose your own tax workspace or talk with our team about personal taxes, business
              returns and amendments.
            </p>
            <Link
              href="/tax-software/contact"
              className={taxButton + ' mt-6 bg-[#073ca2] text-white'}
            >
              Get tax help →
            </Link>
          </section>
          <section className="rounded-2xl border p-6">
            <h2 className="text-2xl font-bold">For future business owners</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Explore tax preparation training, office setup, client service and marketing. Review
              the enrollment steps and costs before you commit.
            </p>
            <Link
              href="/tax-software/professional#enroll"
              className={taxButton + ' mt-6 bg-[#073ca2] text-white'}
            >
              Start your tax business →
            </Link>
          </section>
        </div>
      </main>
    </TaxSiteShell>
  );
}
