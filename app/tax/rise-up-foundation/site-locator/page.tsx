import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Find a VITA Site Near You | Rise Up Foundation',
  description:
    'Use the IRS VITA locator to find free tax preparation sites near you in Indianapolis and across Indiana.',
  keywords: [
    'VITA site locator',
    'find VITA site',
    'free tax help near me',
    'VITA locations Indianapolis',
  ],
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/tax/rise-up-foundation/site-locator',
  },
  openGraph: {
    title: 'Find a VITA Site Near You',
    description: 'Locate free tax preparation sites in your area.',
    url: 'https://www.elevateforhumanity.org/tax/rise-up-foundation/site-locator',
    type: 'website',
  },
};

export default function SiteLocatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Site Locator" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax/rise-up-foundation"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Rise Up Foundation
        </Link>
      </div>

      <h1 className="text-4xl font-bold">Find a VITA Site</h1>
      <p className="mt-3 text-lg text-black">
        Use the official IRS locator to find free tax preparation sites near
        you.
      </p>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">IRS VITA Site Locator</h2>
        <p className="text-black mb-6">
          The IRS maintains a comprehensive database of all VITA sites across
          the country. Use their locator tool to find sites near you, check
          hours, and see what services are available.
        </p>

        <a
          href="https://irs.treasury.gov/freetaxprep/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-green-700 transition"
        >
          Open VITA Site Locator
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Our Location</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">
              Rise Up Foundation - VITA Site
            </h3>
            <p className="text-black mt-2">
              8888 Keystone Crossing, Suite 1300
              <br />
              Indianapolis, IN 46240
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Hours (Tax Season: Jan - Apr 15)</h3>
            <div className="mt-2 space-y-1 text-black">
              <div className="flex justify-between max-w-md">
                <span>Monday - Friday:</span>
                <span className="font-semibold">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between max-w-md">
                <span>Saturday:</span>
                <span className="font-semibold">10:00 AM - 2:00 PM</span>
              </div>
              <div className="flex justify-between max-w-md">
                <span>Sunday:</span>
                <span className="font-semibold">Closed</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Contact</h3>
            <p className="text-black mt-2">
              Phone:{' '}
              <a
                href="mailto:elevate4humanityedu@gmail.com"
                className="text-brand-green-600 hover:underline"
              >
                317-314-3757
              </a>
              <br />
              Email:{' '}
              <a
                href="mailto:elevate4humanityedu@gmail.com"
                className="text-brand-green-600 hover:underline"
              >
                elevate4humanityedu@gmail.com
              </a>
            </p>
          </div>

          <div className="rounded-lg bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-black">
              <strong>Appointment Required:</strong> Please call ahead to
              schedule your appointment. Walk-ins may experience long wait
              times.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">
          What to Expect at a VITA Site
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">1</span>
            <div>
              <h3 className="font-semibold">Check-In</h3>
              <p className="text-sm text-black">
                Arrive at your scheduled time and check in with the greeter
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">2</span>
            <div>
              <h3 className="font-semibold">Document Review</h3>
              <p className="text-sm text-black">
                A volunteer will review your documents to ensure everything is
                complete
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">3</span>
            <div>
              <h3 className="font-semibold">Tax Preparation</h3>
              <p className="text-sm text-black">
                An IRS-certified volunteer will prepare your return with you
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">4</span>
            <div>
              <h3 className="font-semibold">Quality Review</h3>
              <p className="text-sm text-black">
                A second volunteer reviews your return for accuracy
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold text-xl">5</span>
            <div>
              <h3 className="font-semibold">E-File</h3>
              <p className="text-sm text-black">
                Your return is electronically filed with the IRS
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-green-50 border-l-4 border-brand-green-600 p-6">
        <h2 className="text-xl font-bold mb-3">Ready to Get Started?</h2>
        <p className="text-black mb-6">
          Contact us to schedule your appointment or use the IRS locator to find
          other VITA sites in your area.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="mailto:elevate4humanityedu@gmail.com"
            className="px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-green-700 transition"
          >
            Call 317-314-3757
          </a>
          <Link
            href="/tax/rise-up-foundation/free-tax-help"
            className="px-6 py-3 rounded-lg border-2 border-brand-green-600 text-brand-green-600 font-semibold hover:bg-green-50 transition"
          >
            View Eligibility
          </Link>
          <Link
            href="/tax/rise-up-foundation/documents"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
          >
            What to Bring
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-blue-50 border-l-4 border-blue-400 p-6">
        <h3 className="font-semibold text-black">Reference</h3>
        <p className="mt-2 text-sm text-black">
          Official IRS VITA site locator:{' '}
          <a
            href="https://irs.treasury.gov/freetaxprep/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue-600 hover:underline"
          >
            https://irs.treasury.gov/freetaxprep/
          </a>
        </p>
      </section>
    </div>
  );
}
