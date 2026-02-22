import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Calculator,
  ExternalLink,
  Download,
CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tax Tools & Calculators | Supersonic Fast Cash',
  description: 'IRS forms, tax due dates, and financial calculators',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/tax-tools',
  },
};

export default async function TaxToolsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  
  // Fetch tax tools
  const { data: tools } = await db
    .from('tax_tools')
    .select('*')
    .order('category');

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Tax Tools" }]} />
      </div>
{/* Hero */}
      <section className="relative bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-black">
            Tax Tools & Calculators
          </h1>
          <p className="text-xl text-black max-w-3xl">
            Everything you need to prepare and file your taxes
          </p>
        </div>
      </section>

      {/* IRS Forms */}
      <section id="tax-form" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <FileText className="w-12 h-12 text-brand-blue-600" />
            <h2 className="text-4xl font-black text-black">IRS Forms</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="https://www.irs.gov/forms-pubs/about-form-1040"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-brand-blue-50 rounded-lg p-6 border border-brand-blue-200 hover:border-brand-blue-500 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-black text-brand-blue-600">Form 1040</h3>
                <ExternalLink className="w-6 h-6 text-brand-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-black mb-4">
                U.S. Individual Income Tax Return
              </p>
              <div className="flex items-center gap-2 text-brand-blue-600 font-bold">
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </div>
            </a>

            <a
              href="https://www.irs.gov/forms-pubs/about-schedule-c-form-1040"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-brand-green-50 rounded-2xl p-6 border-2 border-brand-green-200 hover:border-brand-green-500 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-black text-brand-green-600">
                  Schedule C
                </h3>
                <ExternalLink className="w-6 h-6 text-brand-green-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-black mb-4">Profit or Loss from Business</p>
              <div className="flex items-center gap-2 text-brand-green-600 font-bold">
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </div>
            </a>

            <a
              href="https://www.irs.gov/forms-pubs/about-form-w-2"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-brand-orange-50 rounded-2xl p-6 border-2 border-brand-orange-200 hover:border-brand-orange-500 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-black text-brand-orange-600">
                  Form W-2
                </h3>
                <ExternalLink className="w-6 h-6 text-brand-orange-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-black mb-4">Wage and Tax Statement</p>
              <div className="flex items-center gap-2 text-brand-orange-600 font-bold">
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </div>
            </a>

            <a
              href="https://www.irs.gov/forms-pubs/about-form-1099-misc"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-brand-blue-50 rounded-2xl p-6 border-2 border-brand-blue-200 hover:border-brand-blue-500 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-black text-brand-blue-600">
                  Form 1099
                </h3>
                <ExternalLink className="w-6 h-6 text-brand-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-black mb-4">Miscellaneous Income</p>
              <div className="flex items-center gap-2 text-brand-blue-600 font-bold">
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </div>
            </a>

            <a
              href="https://www.irs.gov/forms-pubs/about-schedule-a-form-1040"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-brand-red-50 rounded-2xl p-6 border-2 border-brand-red-200 hover:border-brand-red-500 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-black text-brand-red-600">Schedule A</h3>
                <ExternalLink className="w-6 h-6 text-brand-red-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-black mb-4">Itemized Deductions</p>
              <div className="flex items-center gap-2 text-brand-red-600 font-bold">
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </div>
            </a>

            <a
              href="https://www.irs.gov/forms-pubs"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-50 rounded-2xl p-6 border-2 border-gray-300 hover:border-gray-500 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-black text-black">All Forms</h3>
                <ExternalLink className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-black mb-4">
                Browse complete IRS forms library
              </p>
              <div className="flex items-center gap-2 text-black font-bold">
                <ExternalLink className="w-5 h-5" />
                <span>Visit IRS.gov</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Due Dates */}
      <section id="due-dates" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <Calendar className="w-12 h-12 text-brand-green-600" />
            <h2 className="text-4xl font-black text-black">
              Important Tax Due Dates
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-black text-black mb-6">
                2024 Tax Year
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-brand-blue-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-blue-600">APR</div>
                    <div className="text-2xl font-black text-brand-blue-600">15</div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      Individual Tax Returns
                    </div>
                    <div className="text-sm text-black">
                      Form 1040 filing deadline
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-brand-green-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-green-600">
                      MAR
                    </div>
                    <div className="text-2xl font-black text-brand-green-600">15</div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      Partnership Returns
                    </div>
                    <div className="text-sm text-black">
                      Form 1065 filing deadline
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-brand-orange-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-orange-600">
                      MAR
                    </div>
                    <div className="text-2xl font-black text-brand-orange-600">
                      15
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      S-Corporation Returns
                    </div>
                    <div className="text-sm text-black">
                      Form 1120-S filing deadline
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-brand-blue-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-blue-600">
                      APR
                    </div>
                    <div className="text-2xl font-black text-brand-blue-600">
                      15
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      C-Corporation Returns
                    </div>
                    <div className="text-sm text-black">
                      Form 1120 filing deadline
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-black text-black mb-6">
                Quarterly Estimates
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-brand-red-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-red-600">APR</div>
                    <div className="text-2xl font-black text-brand-red-600">15</div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      Q1 Estimated Tax
                    </div>
                    <div className="text-sm text-black">
                      Jan 1 - Mar 31 income
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-brand-red-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-red-600">JUN</div>
                    <div className="text-2xl font-black text-brand-red-600">15</div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      Q2 Estimated Tax
                    </div>
                    <div className="text-sm text-black">
                      Apr 1 - May 31 income
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-brand-red-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-red-600">SEP</div>
                    <div className="text-2xl font-black text-brand-red-600">15</div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      Q3 Estimated Tax
                    </div>
                    <div className="text-sm text-black">
                      Jun 1 - Aug 31 income
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-brand-red-50 rounded-xl">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-3xl font-black text-brand-red-600">JAN</div>
                    <div className="text-2xl font-black text-brand-red-600">15</div>
                  </div>
                  <div>
                    <div className="font-black text-black mb-1">
                      Q4 Estimated Tax
                    </div>
                    <div className="text-sm text-black">
                      Sep 1 - Dec 31 income
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculators */}
      <section id="calculators" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <Calculator className="w-12 h-12 text-brand-orange-600" />
            <h2 className="text-4xl font-black text-black">
              Financial Calculators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link
              href="/supersonic-fast-cash/calculator"
              className="group bg-brand-blue-50 rounded-2xl p-8 border-2 border-brand-blue-200 hover:border-brand-blue-500 transition-all transform hover:scale-105"
            >
              <Calculator className="w-12 h-12 text-brand-blue-600 mb-4" />
              <h3 className="text-2xl font-black text-black mb-3">
                Refund Calculator
              </h3>
              <p className="text-black mb-4">
                Estimate your tax refund amount
              </p>
              <div className="flex items-center gap-2 text-brand-blue-600 font-bold">
                <span>Calculate Now</span>
                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <a
              href="https://www.irs.gov/individuals/tax-withholding-estimator"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-brand-green-50 rounded-2xl p-8 border-2 border-brand-green-200 hover:border-brand-green-500 transition-all transform hover:scale-105"
            >
              <Calculator className="w-12 h-12 text-brand-green-600 mb-4" />
              <h3 className="text-2xl font-black text-black mb-3">
                W-4 Calculator
              </h3>
              <p className="text-black mb-4">Adjust your withholding</p>
              <div className="flex items-center gap-2 text-brand-green-600 font-bold">
                <span>Calculate Now</span>
                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            <a
              href="https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-brand-orange-50 rounded-2xl p-8 border-2 border-brand-orange-200 hover:border-brand-orange-500 transition-all transform hover:scale-105"
            >
              <Calculator className="w-12 h-12 text-brand-orange-600 mb-4" />
              <h3 className="text-2xl font-black text-black mb-3">
                Self-Employment Tax
              </h3>
              <p className="text-black mb-4">Calculate SE tax liability</p>
              <div className="flex items-center gap-2 text-brand-orange-600 font-bold">
                <span>Learn More</span>
                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-6 uppercase">
            Need Professional Help?
          </h2>
          <p className="text-xl mb-8">
            Let our licensed tax experts handle everything for you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/apply"
              className="px-10 py-5 bg-white text-brand-green-600 font-black rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 uppercase shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="px-10 py-5 bg-transparent border-3 border-white text-white font-black rounded-xl hover:bg-white hover:text-brand-green-600 transition-all transform hover:scale-105 uppercase"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
