import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rise Up Foundation - Free VITA Tax Help | Elevate for Humanity',
  description:
    'Free tax preparation for qualifying individuals and families in Indianapolis. IRS-certified volunteers provide free tax help through the VITA program.',
  keywords: [
    'free tax help Indianapolis',
    'VITA tax services',
    'Rise Up Foundation',
    'free tax preparation',
    'volunteer tax help',
    'IRS VITA program',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tax/rise-up-foundation',
  },
  openGraph: {
    title: 'Rise Up Foundation - Free VITA Tax Help',
    description:
      'Free tax preparation for qualifying individuals. IRS-certified volunteers.',
    url: 'https://www.elevateforhumanity.org/tax/rise-up-foundation',
    type: 'website',
  },
};

export default function RiseUpFoundationPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Rise Up Foundation" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax"
          aria-label="Link"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Tax Services
        </Link>
      </div>

      <section className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="inline-block px-3 py-2 rounded-full bg-brand-green-100 text-green-800 text-xs font-semibold mb-4">
          FREE TAX HELP
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Rise Up Foundation
        </h1>
        <p className="text-lg text-black mt-2">
          VITA-style Free Tax Preparation
        </p>

        <p className="mt-6 text-lg text-black leading-relaxed max-w-3xl">
          Rise Up Foundation provides free tax preparation services to
          qualifying individuals and families through the IRS Volunteer Income
          Tax Assistance (VITA) program. Our IRS-certified volunteers help you
          file your taxes accurately and maximize your refund—at no cost to you.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 p-6">
            <div className="text-3xl font-bold text-green-700">100%</div>
            <div className="text-sm text-black mt-1">Free Service</div>
          </div>
          <div className="rounded-lg bg-green-50 p-6">
            <div className="text-3xl font-bold text-green-700">IRS</div>
            <div className="text-sm text-black mt-1">
              Certified Volunteers
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-6">
            <div className="text-3xl font-bold text-green-700">$0</div>
            <div className="text-sm text-black mt-1">No Hidden Fees</div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid md:grid-cols-2 gap-6">
        <Link
          href="/tax/rise-up-foundation/free-tax-help"
          className="block rounded-2xl border-2 border-green-200 bg-white p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold text-black">Get Free Tax Help</h2>
          <p className="mt-2 text-black">
            Learn about eligibility, what to bring, and how to schedule your
            appointment.
          </p>
          <div className="mt-4 text-brand-green-600 font-semibold">
            Learn More →
          </div>
        </Link>

        <Link
          href="/tax/rise-up-foundation/volunteer"
          className="block rounded-2xl border-2 border-green-200 bg-white p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold text-black">Volunteer With Us</h2>
          <p className="mt-2 text-black">
            Join our team of IRS-certified volunteers and help your community.
          </p>
          <div className="mt-4 text-brand-green-600 font-semibold">
            Get Started →
          </div>
        </Link>

        <Link
          href="/tax/rise-up-foundation/training"
          className="block rounded-2xl border-2 border-green-200 bg-white p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold text-black">
            Volunteer Training
          </h2>
          <p className="mt-2 text-black">
            Complete IRS Link & Learn certification to become a volunteer tax
            preparer.
          </p>
          <div className="mt-4 text-brand-green-600 font-semibold">
            Start Training →
          </div>
        </Link>

        <Link
          href="/tax/rise-up-foundation/site-locator"
          className="block rounded-2xl border-2 border-green-200 bg-white p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold text-black">Find a VITA Site</h2>
          <p className="mt-2 text-black">
            Use the IRS locator to find nearby VITA sites and hours.
          </p>
          <div className="mt-4 text-brand-green-600 font-semibold">
            Find Sites →
          </div>
        </Link>
      </section>

      <section className="mt-8 rounded-2xl bg-yellow-50 border-l-4 border-yellow-400 p-6">
        <h2 className="text-lg font-semibold text-black">
          Important Notice
        </h2>
        <p className="mt-2 text-black">
          Rise Up Foundation operates as a separate 501(c)(3) nonprofit
          organization providing free VITA tax services. This program is
          completely separate from SupersonicFastCash paid tax preparation
          services. All VITA services are provided by IRS-certified volunteers
          at no cost to qualifying taxpayers.
        </p>
      </section>
    </div>
  );
}
