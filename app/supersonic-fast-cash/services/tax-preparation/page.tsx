import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata = {
  title: 'Tax Preparation Services | Supersonic Fast Cash',
  description: 'Professional tax preparation for individuals and families. PTIN-credentialed preparers with IRS e-file authorization.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/services/tax-preparation',
  },
};

export default function TaxPreparationPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Tax Preparation" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image src="/images/success-new/success-10.jpg" alt="Tax Preparation" fill className="object-cover" quality={85} priority />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Tax Preparation Services
              </h1>
              <p className="text-xl text-gray-700">
                Professional tax filing for individuals and families
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Individual Tax Returns</h2>
              <p className="text-black mb-6">
                Our PTIN-credentialed tax preparers handle all types of individual tax returns, from simple W-2 filings to complex returns with multiple income sources, deductions, and credits.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">W-2 and 1099 Income</h3>
                    <p className="text-black">Employment and contract income</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Itemized Deductions</h3>
                    <p className="text-black">Maximize your tax savings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Tax Credits</h3>
                    <p className="text-black">EITC, Child Tax Credit, and more</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-8 border border-orange-200">
              <h3 className="text-2xl font-bold mb-4">Apply Now</h3>
              <p className="text-gray-700 mb-6">
                Contact us for a free consultation and personalized quote based on your tax situation.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Free initial consultation</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Transparent pricing - no hidden fees</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Maximum refund guarantee</span>
                </div>
              </div>
              <Link
                href="/supersonic-fast-cash/book-appointment"
                className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Book Free Consultation
              </Link>
              <p className="text-center text-sm text-gray-500 mt-4">
                Or call (317) 314-3757
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Accurate Filing</h3>
              <p className="text-black">PTIN-credentialed preparers ensure accuracy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Maximum Refund</h3>
              <p className="text-black">We find every deduction and credit</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Service</h3>
              <p className="text-black">Most returns completed same day</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
