
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documents to Bring - VITA Tax Help | Rise Up Foundation',
  description:
    'Complete checklist of documents needed for free VITA tax preparation. Bring these items to your appointment.',
  keywords: [
    'VITA documents',
    'tax documents checklist',
    'what to bring tax appointment',
    'VITA requirements',
  ],
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/tax/rise-up-foundation/documents',
  },
  openGraph: {
    title: 'Documents to Bring - VITA Tax Help',
    description:
      'Complete checklist of documents needed for your free tax appointment.',
    url: 'https://www.elevateforhumanity.org/tax/rise-up-foundation/documents',
    type: 'website',
  },
};

export default function DocumentsPage() {

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Documents" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax/rise-up-foundation"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Rise Up Foundation
        </Link>
      </div>

      <h1 className="text-4xl font-bold">Documents to Bring</h1>
      <p className="mt-3 text-lg text-black">
        Complete checklist of everything you need for your free VITA tax
        appointment.
      </p>

      <section className="mt-8 rounded-2xl bg-yellow-50 border-l-4 border-yellow-400 p-6">
        <h2 className="font-semibold text-lg mb-2">Important</h2>
        <p className="text-black">
          Please bring ALL required documents to your appointment. Missing
          documents may delay your tax preparation or require you to reschedule.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-6">
          Required Documents (Everyone)
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-brand-green-600">•</span>
              Identification
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Government-issued photo ID for you (and spouse if filing
                  jointly)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Social Security cards or ITIN letters for everyone on the
                  return
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Birth dates for everyone on the return
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-brand-green-600">•</span>
              Income Documents
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  W-2 forms from ALL employers
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  1099-INT (interest income)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  1099-DIV (dividend income)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  1099-G (unemployment compensation, state tax refund)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  1099-R (retirement/pension income)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  SSA-1099 (Social Security benefits)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Any other income statements
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-brand-green-600">•</span>
              Bank Information
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Bank account number and routing number for direct deposit
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Voided check or bank letter (optional but helpful)
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-brand-green-600">•</span>
              Prior Year Return
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Copy of last year's federal and state tax returns (if
                  available)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-6">
          Additional Documents (If Applicable)
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">
              If You Have Children or Dependents
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Childcare provider information (name, address, tax ID or SSN)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">Childcare expenses paid</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Form 2441 (if you received dependent care benefits from
                  employer)
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">
              If You Paid for Education
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Form 1098-T (tuition statement)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Form 1098-E (student loan interest)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Education expense receipts
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">If You Own a Home</h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Form 1098 (mortgage interest statement)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">Property tax receipts</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">
              If You Had Health Insurance
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Form 1095-A (Health Insurance Marketplace statement)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Form 1095-B or 1095-C (employer or government health coverage)
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">
              If You Made Charitable Donations
            </h3>
            <ul className="space-y-2 pl-6">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Receipts for cash donations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span className="text-black">
                  Written acknowledgment for donations over $250
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Preparation Tips</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold">•</span>
            <p className="text-black">
              Organize documents by category before your appointment
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold">•</span>
            <p className="text-black">
              Make copies of important documents for your records
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold">•</span>
            <p className="text-black">
              Bring a folder or envelope to keep everything together
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold">•</span>
            <p className="text-black">
              Double-check that all Social Security numbers are correct
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-green-600 font-bold">•</span>
            <p className="text-black">
              Call ahead if you're missing any documents - we can advise
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-brand-green-50 border-l-4 border-brand-green-600 p-6">
        <h2 className="text-xl font-bold mb-3">Questions About Documents?</h2>
        <p className="text-black mb-6">
          Not sure if you have everything? Contact us and we'll help you prepare
          for your appointment.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/support"
            className="px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-brand-green-700 transition"
          >
            Call support center
          </a>
          <Link
            href="/tax/rise-up-foundation/free-tax-help"
            className="px-6 py-3 rounded-lg border-2 border-brand-green-600 text-brand-green-600 font-semibold hover:bg-brand-green-50 transition"
          >
            Schedule Appointment
          </Link>
          <Link
            href="/tax/rise-up-foundation/faq"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
          >
            View FAQ
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6">
        <h3 className="font-semibold text-black">Printable Checklist</h3>
        <p className="mt-2 text-sm text-black">
          Download and print the IRS VITA intake checklist:{' '}
          <a
            href="https://www.irs.gov/pub/irs-pdf/f13614c.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue-600 hover:underline"
          >
            Form 13614-C (PDF)
          </a>
        </p>
      </section>
    </div>
  );
}
