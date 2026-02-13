import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  Circle,
  DollarSign,
  Briefcase,
  FileText,
  Calculator,
  TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tax Services & Pricing - SupersonicFastCash | Elevate for Humanity',
  description:
    'Professional tax preparation, refund advances, business taxes, and bookkeeping services. Transparent pricing with no hidden fees.',
  keywords: [
    'tax preparation services',
    'refund advance',
    'business taxes',
    'bookkeeping',
    'tax services Indianapolis',
  ],
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/tax/supersonicfastcash/services',
  },
  openGraph: {
    title: 'Tax Services & Pricing - SupersonicFastCash',
    description:
      'Professional tax preparation with refund advances up to $7,500. Same-day service available.',
    url: 'https://www.elevateforhumanity.org/tax/supersonicfastcash/services',
    type: 'website',
  },
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Services" }]} />
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
        <div className="inline-block px-3 py-2 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-4">
          PAID SERVICES
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          SupersonicFastCash Services
        </h1>
        <p className="text-lg text-black mt-2">
          Professional Tax Preparation & Financial Services
        </p>

        <p className="mt-6 text-lg text-black leading-relaxed max-w-3xl">
          Fast, professional tax preparation with same-day service and refund
          advances up to $7,500. We handle individual returns, business taxes,
          and provide year-round bookkeeping services.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/supersonic-fast-cash"
            className="px-6 py-3 rounded-lg bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition"
          >
            View Full Details
          </Link>
          <Link
            href="/tax/supersonicfastcash/documents"
            className="px-6 py-3 rounded-lg border-2 border-brand-blue-600 text-brand-blue-600 font-semibold hover:bg-gray-50 transition"
          >
            Upload Documents
          </Link>
          <a
            href="mailto:elevate4humanityedu@gmail.com"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
          >
            Call 317-314-3757
          </a>
        </div>
      </section>

      <section className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border-2 border-blue-200 bg-white p-6 hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-brand-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">
            Individual Tax Preparation
          </h2>
          <p className="text-black mb-4">
            Professional preparation of federal and state returns. W-2s, 1099s,
            itemized deductions, and more.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <span>Same-day filing available</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <span>Maximum refund guarantee</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <span>E-file included</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-black">Starting at</div>
            <div className="text-2xl font-bold text-brand-blue-600">$89</div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-green-200 bg-white p-6 hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-brand-green-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">
            Tax Refund Advance
          </h2>
          <p className="text-black mb-4">
            Get your refund fast with advances from $250 to $7,500. Powered by
            EPS Financial.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <span>0% APR on $250-$1,000</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <span>No credit check required</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <span>Same-day cash available</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-black">Loan amounts</div>
            <div className="text-2xl font-bold text-brand-green-600">
              $250-$7,500
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-blue-200 bg-white p-6 hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">
            Business Tax Services
          </h2>
          <p className="text-black mb-4">
            Schedule C, partnerships, S-corps, and corporate returns. Quarterly
            estimates included.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>All business entity types</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Quarterly tax planning</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Audit support included</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-black">Starting at</div>
            <div className="text-2xl font-bold text-blue-600">$299</div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-orange-200 bg-white p-6 hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <Calculator className="w-6 h-6 text-brand-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">
            Bookkeeping Services
          </h2>
          <p className="text-black mb-4">
            Monthly bookkeeping, payroll processing, and financial statements
            for small businesses.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>QuickBooks setup & training</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>Monthly reconciliation</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>Financial reports</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-black">Starting at</div>
            <div className="text-2xl font-bold text-brand-orange-600">
              $199/mo
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-red-200 bg-white p-6 hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-brand-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">
            Amended Returns
          </h2>
          <p className="text-black mb-4">
            Need to fix a previous return? We handle amended returns for current
            and prior 3 years.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>Form 1040-X preparation</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>Prior year corrections</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <span>IRS correspondence help</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-black">Starting at</div>
            <div className="text-2xl font-bold text-brand-orange-600">$149</div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-teal-200 bg-white p-6 hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Tax Planning</h2>
          <p className="text-black mb-4">
            Year-round tax planning to minimize your tax liability and maximize
            deductions.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>Quarterly consultations</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>Estimated tax calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <Circle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>Strategy recommendations</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-black">Starting at</div>
            <div className="text-2xl font-bold text-teal-600">$399/yr</div>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-6">
          Why Choose SupersonicFastCash?
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Professional Service</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  IRS-certified tax preparers with years of experience
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Professional tax software - industry-leading accuracy
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Maximum refund guarantee or your money back
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Audit support included with all returns
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Fast & Convenient</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Same-day filing available for most returns
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Secure online document upload
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Walk-ins welcome, no appointment needed
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Extended hours during tax season
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-blue-50 border-l-4 border-brand-blue-600 p-6">
        <h2 className="text-xl font-bold mb-3">Ready to Get Started?</h2>
        <p className="text-black mb-6">
          Upload your documents online or visit us in person. Same-day service
          available.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/tax/supersonicfastcash/documents"
            className="px-6 py-3 rounded-lg bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition"
          >
            Upload Documents
          </Link>
          <a
            href="mailto:elevate4humanityedu@gmail.com"
            className="px-6 py-3 rounded-lg border-2 border-brand-blue-600 text-brand-blue-600 font-semibold hover:bg-gray-50 transition"
          >
            Call 317-314-3757
          </a>
          <Link
            href="/supersonic-fast-cash"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
          >
            View Full Details
          </Link>
        </div>
      </section>
    </div>
  );
}
