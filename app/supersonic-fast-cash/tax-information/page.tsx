import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Calendar, FolderOpen, TrendingUp, Circle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tax Information | Supersonic Fast Cash',
  description: 'Tax tips, rates, and document retention guide',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/tax-information',
  },
};

export default async function TaxInformationPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch tax information
  const { data: taxInfo } = await supabase
    .from('tax_information')
    .select('*')
    .order('category');
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Tax Information" }]} />
      </div>
{/* Hero */}
      <section className="relative bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-black">
            Tax Information
          </h1>
          <p className="text-xl text-black max-w-3xl">
            Everything you need to know about filing your taxes
          </p>
        </div>
      </section>

      {/* Tax Tips */}
      <section id="tax-tips" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <FileText className="w-12 h-12 text-blue-600" />
            <h2 className="text-4xl font-black text-black">Tax Tips</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-black mb-4">Maximize Your Deductions</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Keep detailed records of all business expenses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Track mileage for business travel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Save receipts for charitable donations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Consider home office deduction if eligible</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-8 border border-green-200">
              <h3 className="text-2xl font-bold text-black mb-4">Avoid Common Mistakes</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Double-check Social Security numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Report all income, including side gigs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>File on time to avoid penalties</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Choose the right filing status</span>
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-lg p-8 border border-orange-200">
              <h3 className="text-2xl font-bold text-black mb-4">Tax Credits to Claim</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Earned Income Tax Credit (EITC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Child Tax Credit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Education credits (American Opportunity, Lifetime Learning)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Retirement savings contributions credit</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-black mb-4">Year-Round Planning</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Adjust withholding if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Make quarterly estimated payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Contribute to retirement accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Review tax situation after major life changes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tax Rates */}
      <section id="tax-rates" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <TrendingUp className="w-12 h-12 text-green-600" />
            <h2 className="text-4xl font-black text-black">2024 Tax Rates</h2>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-black text-black mb-6">Federal Income Tax Brackets</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-4 px-4 font-black">Tax Rate</th>
                    <th className="text-left py-4 px-4 font-black">Single</th>
                    <th className="text-left py-4 px-4 font-black">Married Filing Jointly</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 font-bold text-blue-600">10%</td>
                    <td className="py-4 px-4">$0 - $11,600</td>
                    <td className="py-4 px-4">$0 - $23,200</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 font-bold text-blue-600">12%</td>
                    <td className="py-4 px-4">$11,601 - $47,150</td>
                    <td className="py-4 px-4">$23,201 - $94,300</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 font-bold text-blue-600">22%</td>
                    <td className="py-4 px-4">$47,151 - $100,525</td>
                    <td className="py-4 px-4">$94,301 - $201,050</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 font-bold text-blue-600">24%</td>
                    <td className="py-4 px-4">$100,526 - $191,950</td>
                    <td className="py-4 px-4">$201,051 - $383,900</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 font-bold text-blue-600">32%</td>
                    <td className="py-4 px-4">$191,951 - $243,725</td>
                    <td className="py-4 px-4">$383,901 - $487,450</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-4 font-bold text-blue-600">35%</td>
                    <td className="py-4 px-4">$243,726 - $609,350</td>
                    <td className="py-4 px-4">$487,451 - $731,200</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-bold text-blue-600">37%</td>
                    <td className="py-4 px-4">$609,351+</td>
                    <td className="py-4 px-4">$731,201+</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-sm text-black">
              * Rates shown are for 2024 tax year. Consult with a tax professional for personalized advice.
            </p>
          </div>
        </div>
      </section>

      {/* Document Retention */}
      <section id="retention" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <FolderOpen className="w-12 h-12 text-orange-600" />
            <h2 className="text-4xl font-black text-black">Document Retention Guide</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200">
              <h3 className="text-2xl font-black text-red-600 mb-4">Keep 3 Years</h3>
              <ul className="space-y-2 text-black">
                <li>• Employment tax records</li>
                <li>• Income documents (W-2, 1099)</li>
                <li>• Expense receipts</li>
                <li>• Bank statements</li>
                <li>• Cancelled checks</li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-2xl p-8 border-2 border-orange-200">
              <h3 className="text-2xl font-black text-orange-600 mb-4">Keep 7 Years</h3>
              <ul className="space-y-2 text-black">
                <li>• Tax returns and supporting docs</li>
                <li>• Business expense records</li>
                <li>• Property records</li>
                <li>• Investment statements</li>
                <li>• Loan documents</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-200">
              <h3 className="text-2xl font-black text-green-600 mb-4">Keep Permanently</h3>
              <ul className="space-y-2 text-black">
                <li>• Tax returns (copies)</li>
                <li>• Property deeds</li>
                <li>• Stock certificates</li>
                <li>• Retirement account records</li>
                <li>• Business formation documents</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 rounded-2xl p-8 border-2 border-blue-200">
            <h3 className="text-2xl font-black text-black mb-4">Important Notes</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>The IRS generally has 3 years to audit your return</span>
              </li>
              <li className="flex items-start gap-2">
                <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>If you underreport income by 25%+, the IRS has 6 years</span>
              </li>
              <li className="flex items-start gap-2">
                <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>No statute of limitations if you don't file or file fraudulently</span>
              </li>
              <li className="flex items-start gap-2">
                <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Keep records longer if you have ongoing tax issues</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-6 uppercase">
            Need Help With Your Taxes?
          </h2>
          <p className="text-xl mb-8">
            Our licensed tax professionals are here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="px-10 py-5 bg-white text-blue-600 font-black rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 uppercase shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="px-10 py-5 bg-transparent border-3 border-white text-white font-black rounded-xl hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 uppercase"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
