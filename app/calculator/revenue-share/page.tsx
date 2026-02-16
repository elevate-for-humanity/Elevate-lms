'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  FileText,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function RevenueShareCalculator() {
  const [clientPayment, setClientPayment] = useState(300);
  const [addOnFees, setAddOnFees] = useState(50);
  const [numberOfReturns, setNumberOfReturns] = useState(100);

  // Main office gets 40% of base fee + 100% of add-on fees
  const mainOfficeBaseShare = clientPayment * 0.4;
  const mainOfficeTotal = mainOfficeBaseShare + addOnFees;

  // Suboffice gets 60% of base fee ONLY (no add-on fees)
  const subofficeShare = clientPayment * 0.6;
  const monthlyRevenue = subofficeShare * numberOfReturns;
  const annualRevenue = monthlyRevenue * 4; // 4 month tax season

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Calculator', href: '/calculator' }, { label: 'Revenue Share' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/programs/efh-business-startup-marketing-hero.jpg"
          alt="Revenue Share Calculator"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Calculator className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Revenue Share Calculator
          </h1>
          <p className="text-xl">
            Calculate Your Potential Earnings as a Suboffice Partner
          </p>
        </div>
      </section>

      {/* Calculator */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-black mb-6">
              Input Your Numbers
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Average Client Payment
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-black">$</span>
                  <input
                    type="number"
                    value={clientPayment}
                    onChange={(e) => setClientPayment(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-black mt-1">
                  Typical range: $150-$500
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Add-On Fees per Return (Main Office Keeps)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-black">$</span>
                  <input
                    type="number"
                    value={addOnFees}
                    onChange={(e) => setAddOnFees(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-black mt-1">
                  Refund advance, prepaid cards, etc. (for reference only)
                </p>
              </div>

              <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-brand-blue-900 mb-2">
                  What's Included (No Extra Cost)
                </h3>
                <ul className="text-sm text-brand-blue-800 space-y-1">
                  <li>
                    <span className="text-slate-400 flex-shrink-0">•</span> Professional Tax Software
                    Software (unlimited)
                  </li>
                  <li>
                    <span className="text-slate-400 flex-shrink-0">•</span> All
                    training and support
                  </li>
                  <li>
                    <span className="text-slate-400 flex-shrink-0">•</span> Marketing
                    materials
                  </li>
                  <li>
                    <span className="text-slate-400 flex-shrink-0">•</span> No
                    per-return fees
                  </li>
                  <li>
                    <span className="text-slate-400 flex-shrink-0">•</span> No monthly
                    software costs
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Returns per Month
                </label>
                <input
                  type="number"
                  value={numberOfReturns}
                  onChange={(e) => setNumberOfReturns(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-black mt-1">
                  Average: 50-200 per month
                </p>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Per Return Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                Per Return Breakdown
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-black">Base Tax Prep Fee</span>
                  <span className="text-xl font-bold">
                    ${clientPayment.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-black">
                    <span>Main Office Share (40%)</span>
                    <span>-${mainOfficeBaseShare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Your Share (60%)</span>
                    <span>+${subofficeShare.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold text-black">
                    Add-On Fees (Main Office)
                  </span>
                  <span className="text-lg text-black">
                    ${addOnFees.toFixed(2)}
                  </span>
                </div>

                <div className="bg-green-50 rounded-lg p-4 mt-4 border-2 border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-green-900">
                      Your Total per Return
                    </span>
                    <span className="text-3xl font-bold text-green-600">
                      ${subofficeShare.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-green-700 mt-2">
                    60% of base tax prep fee only
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-black mb-1">
                    <span>Main Office Gets:</span>
                    <span className="font-medium">
                      ${mainOfficeTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-black">
                    40% base (${mainOfficeBaseShare.toFixed(2)}) + 100% add-ons
                    (${addOnFees.toFixed(2)})
                  </div>
                  <div className="text-xs text-black mt-1">
                    (Includes software, training, support, add-on processing)
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly & Annual Projections */}
            <div className="bg-green-600 rounded-lg shadow-md p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">
                Your Potential Earnings
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span className="text-sm opacity-90">Monthly Revenue</span>
                  </div>
                  <div className="text-4xl font-bold">
                    ${monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-sm opacity-75 mt-1">
                    Based on {numberOfReturns} returns/month
                  </p>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <span className="text-sm opacity-90">
                      Annual Revenue (4-month season)
                    </span>
                  </div>
                  <div className="text-4xl font-bold">
                    ${annualRevenue.toLocaleString()}
                  </div>
                  <p className="text-sm opacity-75 mt-1">
                    January - April tax season
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-black mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-brand-blue-600">
                    {numberOfReturns * 4}
                  </div>
                  <div className="text-xs text-black">
                    Total Returns/Season
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    ${(annualRevenue / (numberOfReturns * 4)).toFixed(0)}
                  </div>
                  <div className="text-xs text-black">Avg per Return</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-brand-blue-600">
                    {((subofficeShare / clientPayment) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-black">Your Margin</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    ${(annualRevenue * 0.3).toLocaleString()}
                  </div>
                  <div className="text-xs text-black">Est. Taxes (30%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scenarios */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            Example Scenarios
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">Part-Time Office</h3>
              <ul className="space-y-2 text-sm text-black">
                <li>• 50 returns/month</li>
                <li>• $250 avg payment</li>
                <li>• 1 preparer</li>
              </ul>
              <div className="mt-4 pt-4 border-t">
                <div className="text-2xl font-bold text-green-600">$30,000</div>
                <div className="text-xs text-black">
                  Annual revenue (60% of $250 × 50 × 4)
                </div>
              </div>
            </div>

            <div className="border-2 border-brand-blue-500 rounded-lg p-6 bg-brand-blue-50">
              <div className="inline-block bg-brand-blue-600 text-white text-xs px-2 py-2 rounded mb-2">
                POPULAR
              </div>
              <h3 className="font-bold text-lg mb-4">Full-Time Office</h3>
              <ul className="space-y-2 text-sm text-black">
                <li>• 100 returns/month</li>
                <li>• $300 avg payment</li>
                <li>• 2 preparers</li>
              </ul>
              <div className="mt-4 pt-4 border-t">
                <div className="text-2xl font-bold text-green-600">$72,000</div>
                <div className="text-xs text-black">
                  Annual revenue (60% of $300 × 100 × 4)
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4">High-Volume Office</h3>
              <ul className="space-y-2 text-sm text-black">
                <li>• 200 returns/month</li>
                <li>• $350 avg payment</li>
                <li>• 4 preparers</li>
              </ul>
              <div className="mt-4 pt-4 border-t">
                <div className="text-2xl font-bold text-green-600">
                  $168,000
                </div>
                <div className="text-xs text-black">
                  Annual revenue (60% of $350 × 200 × 4)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-lg text-black mb-4">
            Important Notes
          </h3>
          <ul className="space-y-2 text-sm text-black">
            <li>
              • <strong>Payment Timing:</strong> You receive payment only after
              IRS releases client refunds (typically 23-26 days)
            </li>
            <li>
              • <strong>Taxes:</strong> Set aside 30-35% for self-employment and
              income taxes
            </li>
            <li>
              • <strong>Volume Bonuses:</strong> After first year, qualify for
              better splits (up to 68/32)
            </li>
            <li>
              • <strong>Quality Bonuses:</strong> Earn up to +4% for zero audits
              and high satisfaction
            </li>
            <li>
              • <strong>Software Included:</strong> Professional tax software, training,
              and support included - no monthly fees
            </li>
            <li>
              • <strong>Add-On Fees:</strong> Main office keeps 100% of refund
              advance, prepaid card, and bank product fees
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 bg-brand-blue-900 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-6">
            Complete onboarding and start earning revenue share today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/suboffice-onboarding"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all"
            >
              Start Onboarding
            </Link>
            <Link
              href="/docs/revenue-sharing-policy.md"
              className="bg-white hover:bg-gray-100 text-brand-blue-900 px-8 py-4 rounded-lg text-lg font-bold transition-all flex items-center justify-center"
            >
              <FileText className="w-5 h-5 mr-2" />
              View Full Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
